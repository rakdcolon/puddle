import { expect, test, vi } from 'vitest'

const signOut = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { signOut } }),
}))
vi.mock('@/lib/auth/session', () => ({ ACTIVITY_COOKIE: 'activity-session' }))
import { POST } from '@/app/api/auth/signout/route'

test.each([
  ['/', 'https://qa-example.vercel.app/'],
  ['https://solvepuddle.com', 'https://solvepuddle.com/'],
])('sign-out resolves configured app URL %s and clears the activity cookie', async (configured, expected) => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', configured)
  const response = await POST(new Request('https://qa-example.vercel.app/api/auth/signout', { method: 'POST' }))
  expect(response.headers.get('location')).toBe(expected)
  expect(response.headers.get('set-cookie')).toContain('activity-session=; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0')
  expect(signOut).toHaveBeenCalled()
})
