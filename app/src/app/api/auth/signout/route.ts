import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ACTIVITY_COOKIE } from '@/lib/auth/session'

export async function POST() {
  // Clear whichever auth surface is active: the Supabase website session and
  // the Discord Activity iframe cookie. Doing both keeps sign-out consistent
  // with getCurrentUser(), which accepts either.
  const supabase = await createClient()
  await supabase.auth.signOut()

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = NextResponse.redirect(new URL('/', origin))
  // Match the attributes the cookie was set with (token route) so the
  // partitioned cookie is actually removed inside the iframe.
  res.headers.append(
    'Set-Cookie',
    `${ACTIVITY_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0`,
  )
  return res
}
