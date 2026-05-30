'use client'

import { DiscordSDK, patchUrlMappings } from '@discord/embedded-app-sdk'

// True when the page is running inside Discord's Activity iframe. Discord
// appends ?frame_id=... when it loads the activity.
export function isInDiscordActivity(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('frame_id')
}

let sdkPromise: Promise<DiscordSDK> | null = null

// Lazily construct the SDK and wait for the handshake. Safe to call repeatedly.
export function getDiscordSdk(): Promise<DiscordSDK> {
  if (!sdkPromise) {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
    if (!clientId) return Promise.reject(new Error('NEXT_PUBLIC_DISCORD_CLIENT_ID is not set'))
    const sdk = new DiscordSDK(clientId)
    sdkPromise = sdk.ready().then(() => sdk)
  }
  return sdkPromise
}

// Supabase-js hardcodes the full https://<ref>.supabase.co URL, which the
// activity sandbox would block (blocked:csp). Rewrite those requests to the
// proxied /supabase path. REQUIRES a matching URL mapping in the Developer
// Portal: prefix "/supabase" -> target "<ref>.supabase.co".
export function patchSupabaseForActivity(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return
  patchUrlMappings([{ prefix: '/supabase', target: new URL(url).hostname }])
}

// Full Activity auth handshake: open Discord's OAuth modal, exchange the code
// server-side (which sets our activity session cookie + merges the account),
// then complete the SDK's authenticate() so RPC commands are authorized.
export async function authenticateDiscordActivity(): Promise<void> {
  const sdk = await getDiscordSdk()
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!

  const { code } = await sdk.commands.authorize({
    client_id: clientId,
    response_type: 'code',
    prompt: 'none',
    scope: ['identify', 'email'],
  })

  const res = await fetch('/api/discord/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new Error('Discord token exchange failed')
  const { access_token } = await res.json()

  await sdk.commands.authenticate({ access_token })
}
