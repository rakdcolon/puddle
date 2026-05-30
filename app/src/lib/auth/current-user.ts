import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUserById, getUserBySupabaseId } from '@/lib/db/users'
import { verifyActivitySession, ACTIVITY_COOKIE } from './session'
import type { User } from '@/types'

// Resolves the canonical app user for the current request, accepting either
// auth surface:
//   1. The Discord Activity session cookie (set by /api/discord/token).
//   2. A normal Supabase session (Google or Discord login on the website).
//
// Use this in route handlers instead of calling supabase.auth.getUser()
// directly, so solves and profile data attribute correctly in both contexts.
export async function getCurrentUser(): Promise<User | null> {
  // 1. Discord Activity iframe session.
  const jar = await cookies()
  const token = jar.get(ACTIVITY_COOKIE)?.value
  if (token) {
    const payload = verifyActivitySession(token)
    if (payload) {
      const user = await getUserById(payload.userId)
      if (user) return user
    }
  }

  // 2. Supabase session (website).
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (authUser) return getUserBySupabaseId(authUser)

  return null
}
