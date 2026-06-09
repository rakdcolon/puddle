import { createHmac, timingSafeEqual } from 'node:crypto'

// GitHub signs every webhook delivery with HMAC-SHA256 over the raw request
// body, using the secret configured on the repo webhook. The signature arrives
// as `X-Hub-Signature-256: sha256=<hex>`. We recompute it and compare in
// constant time before trusting the payload.
// https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
export function verifyGithubSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  const got = Buffer.from(signature)
  const want = Buffer.from(expected)
  // timingSafeEqual throws on length mismatch — guard first.
  if (got.length !== want.length) return false
  try {
    return timingSafeEqual(got, want)
  } catch {
    return false
  }
}
