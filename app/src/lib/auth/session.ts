import crypto from 'node:crypto'

// Lightweight signed session used ONLY inside the Discord Activity iframe,
// where Supabase's cookie-based OAuth session can't run. After the Discord
// token exchange we mint one of these and set it as a partitioned cookie.
//
// Format: base64url(payload) + "." + base64url(hmac-sha256). Payload is
// { userId, exp }. Keep it minimal — it just maps the iframe session to a
// canonical users.id; all authorization still goes through the service client.

const SECRET = process.env.DISCORD_ACTIVITY_SESSION_SECRET ?? ''
const DEFAULT_TTL = 60 * 60 * 24 * 30 // 30 days

interface SessionPayload {
  userId: string
  exp: number
}

export function signActivitySession(userId: string, ttlSeconds = DEFAULT_TTL): string {
  if (!SECRET) throw new Error('DISCORD_ACTIVITY_SESSION_SECRET is not set')
  const payload: SessionPayload = { userId, exp: Math.floor(Date.now() / 1000) + ttlSeconds }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyActivitySession(token: string): { userId: string } | null {
  if (!SECRET || !token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null

  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null

  try {
    const { userId, exp } = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload
    if (!userId || exp < Math.floor(Date.now() / 1000)) return null
    return { userId }
  } catch {
    return null
  }
}

export const ACTIVITY_COOKIE = 'puddle.activity'
