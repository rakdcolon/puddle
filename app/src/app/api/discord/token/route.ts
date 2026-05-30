import { NextResponse, type NextRequest } from 'next/server'
import { getOrCreateUserFromIdentity } from '@/lib/db/users'
import { signActivitySession, ACTIVITY_COOKIE } from '@/lib/auth/session'
import type { AuthIdentity } from '@/types'

// Discord Activity auth, server side. The iframe client obtains an OAuth `code`
// via the Embedded App SDK's authorize() and POSTs it here. We exchange it for
// an access token, fetch the Discord identity, find-or-merge the canonical app
// user, and set the partitioned activity session cookie.
//
// We return { access_token } so the client can finish the SDK handshake with
// discordSdk.commands.authenticate({ access_token }).

const DISCORD_API = 'https://discord.com/api'

export async function POST(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Discord not configured' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const code = body?.code
  if (typeof code !== 'string') {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  // 1. Exchange the authorization code for an access token.
  const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
    }),
  })
  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 401 })
  }
  const { access_token } = await tokenRes.json()

  // 2. Fetch the Discord user behind the token.
  const meRes = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (!meRes.ok) {
    return NextResponse.json({ error: 'Could not load Discord user' }, { status: 401 })
  }
  const me = await meRes.json()

  // 3. Resolve / merge the canonical app user.
  const identity: AuthIdentity = {
    provider: 'discord',
    sub: String(me.id),
    email: me.email ?? '',
    emailVerified: me.verified === true,
    displayName: me.global_name ?? me.username ?? 'Puzzler',
  }
  const user = await getOrCreateUserFromIdentity(identity)

  // 4. Mint the activity session cookie. It must be SameSite=None + Partitioned
  //    + Secure to survive inside the {clientId}.discordsays.com iframe.
  const session = signActivitySession(user.id)
  const res = NextResponse.json({ access_token })
  res.headers.append(
    'Set-Cookie',
    `${ACTIVITY_COOKIE}=${session}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${60 * 60 * 24 * 30}`,
  )
  return res
}
