import { createHmac } from 'node:crypto'
import { expect, test, vi } from 'vitest'
import { verifyGithubSignature } from '@/lib/github/webhook'
test('accepts only signatures matching the exact body and configured secret', () => {
  vi.stubEnv('GITHUB_WEBHOOK_SECRET','unit-secret')
  const body = '{"action":"published"}'
  const signature = 'sha256='+createHmac('sha256','unit-secret').update(body).digest('hex')
  expect(verifyGithubSignature(body,signature)).toBe(true)
  expect(verifyGithubSignature(body+' ',signature)).toBe(false)
  expect(verifyGithubSignature(body,'short')).toBe(false)
  expect(verifyGithubSignature(body,null)).toBe(false)
  vi.stubEnv('GITHUB_WEBHOOK_SECRET','');expect(verifyGithubSignature(body,signature)).toBe(false)
})
