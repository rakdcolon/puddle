import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { totalXpToLevel } from '@/lib/utils/xp'
import type { User, UserProfile, CalendarEntry, AuthProvider, AuthIdentity } from '@/types'

const SUB_COLUMN: Record<AuthProvider, 'google_sub' | 'discord_sub'> = {
  google: 'google_sub',
  discord: 'discord_sub',
}

// Total XP from all solves EXCLUDING today, so the client can add the just-earned XP on top.
export async function getXPBeforeToday(userId: string, today: string): Promise<{ totalXp: number; level: number }> {
  const db = createServiceClient()
  const { data: solves } = await db
    .from('solves')
    .select('elapsed_seconds, hints_used, attempts, puzzles(date_active)')
    .eq('user_id', userId)
    .eq('status', 'solved')

  const totalXp = (solves ?? []).reduce((sum, s) => {
    if ((s.puzzles as any)?.date_active === today) return sum
    let xp = 100
    if (s.elapsed_seconds && s.elapsed_seconds < 120) xp += 50
    else if (s.elapsed_seconds && s.elapsed_seconds < 300) xp += 25
    xp -= (s.hints_used ?? 0) * 15
    xp -= Math.max(0, ((s.attempts ?? 1) - 1)) * 10
    return sum + Math.max(10, xp)
  }, 0)

  const level = Math.floor(totalXp / 500) + 1
  return { totalXp, level }
}

// Consecutive solved days ending yesterday (does not count today, so +1 on solve shows the new streak).
export async function getCurrentStreak(userId: string): Promise<number> {
  const db = createServiceClient()
  const { data: solves } = await db
    .from('solves')
    .select('puzzles(date_active)')
    .eq('user_id', userId)
    .eq('status', 'solved')

  const solvedDates = new Set(
    (solves ?? []).map(s => (s.puzzles as any)?.date_active).filter(Boolean),
  )

  let streak = 0
  const today = new Date()
  for (let i = 1; i <= 365; i++) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    if (solvedDates.has(d.toISOString().slice(0, 10))) streak++
    else break
  }
  return streak
}

export async function getUserById(id: string): Promise<User | null> {
  const db = createServiceClient()
  const { data } = await db.from('users').select('*').eq('id', id).maybeSingle()
  return (data as User) ?? null
}

// Normalize a Supabase auth user (Google or Discord provider) into an identity.
export function identityFromSupabaseUser(supabaseUser: SupabaseUser): AuthIdentity {
  const provider: AuthProvider =
    supabaseUser.app_metadata?.provider === 'discord' ? 'discord' : 'google'
  const meta = supabaseUser.user_metadata ?? {}
  const sub = meta.sub ?? meta.provider_id ?? supabaseUser.id
  const displayName =
    meta.full_name ?? meta.name ?? meta.global_name ?? supabaseUser.email?.split('@')[0] ?? 'Puzzler'
  // Google emails are always verified; Discord exposes an explicit flag.
  const emailVerified = provider === 'google' ? true : meta.email_verified === true
  return {
    provider,
    sub: String(sub),
    email: supabaseUser.email ?? meta.email ?? '',
    emailVerified,
    displayName,
  }
}

export async function getUserBySupabaseId(supabaseUser: SupabaseUser): Promise<User | null> {
  const { sub, email } = identityFromSupabaseUser(supabaseUser)
  const db = createServiceClient()

  // Email is the canonical merge key. When Supabase links a second identity
  // (e.g. Discord onto an existing Google account by matching verified email),
  // app_metadata.provider and user_metadata.sub can disagree — provider stays
  // the original while sub reflects the latest login — so resolving by a single
  // provider's sub column misses the row. Resolve by email first.
  if (email) {
    const { data: byEmail } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .maybeSingle()
    if (byEmail) return byEmail as User
  }

  // Fall back to matching either provider sub (covers rows without an email).
  const { data: bySub } = await db
    .from('users')
    .select('*')
    .or(`google_sub.eq.${sub},discord_sub.eq.${sub}`)
    .limit(1)
    .maybeSingle()
  return (bySub as User) ?? null
}

// Find-or-create the canonical user for an identity, merging onto an existing
// account when the (verified) email already belongs to one.
//
// Resolution order:
//   1. A row already carrying this provider's sub → return it.
//   2. A row with the same email, but only if this email is VERIFIED — attach
//      this provider's sub to it (the merge). Verification is required so a
//      provider account opened with someone else's address can't hijack it.
//   3. Otherwise create a fresh row.
export async function getOrCreateUserFromIdentity(identity: AuthIdentity): Promise<User> {
  const db = createServiceClient()
  const col = SUB_COLUMN[identity.provider]

  // 1. Already linked.
  const { data: bySub } = await db.from('users').select('*').eq(col, identity.sub).maybeSingle()
  if (bySub) {
    await ensureSettings(bySub.id)
    return bySub as User
  }

  // 2. Merge onto an existing account by verified email.
  if (identity.email && identity.emailVerified) {
    const { data: byEmail } = await db
      .from('users')
      .select('*')
      .eq('email', identity.email)
      .maybeSingle()
    if (byEmail) {
      // Only fill the sub if this provider isn't already linked to that row.
      const linked = byEmail[col]
        ? (byEmail as User)
        : ((
            await db.from('users').update({ [col]: identity.sub }).eq('id', byEmail.id).select().single()
          ).data as User)
      await ensureSettings(linked.id)
      return linked
    }
  }

  // 3. Brand-new account.
  const { data: created, error } = await db
    .from('users')
    .insert({ [col]: identity.sub, display_name: identity.displayName, email: identity.email })
    .select()
    .single()
  if (error) throw error

  await ensureSettings(created.id)
  return created as User
}

// Backwards-compatible wrapper used by the OAuth callback (Supabase sessions).
export async function getOrCreateUser(supabaseUser: SupabaseUser): Promise<User> {
  return getOrCreateUserFromIdentity(identityFromSupabaseUser(supabaseUser))
}

async function ensureSettings(userId: string): Promise<void> {
  const db = createServiceClient()
  await db
    .from('user_settings')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const db = createServiceClient()

  const [{ data: user }, { data: settings }, { data: solves }] = await Promise.all([
    db.from('users').select('*').eq('id', userId).single(),
    db.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    db
      .from('solves')
      .select('*, puzzles(title, issue_no, genre, date_active)')
      .eq('user_id', userId)
      .order('solved_at', { ascending: false }),
  ])

  if (!user) throw new Error('User not found')

  const allSolves = solves ?? []
  const solved = allSolves.filter(s => s.status === 'solved')

  // Aggregate stats
  const totalSolved = solved.length
  const totalAttempted = allSolves.length
  const winPct = totalAttempted > 0 ? Math.round((totalSolved / totalAttempted) * 100) : 0
  const timeSolves = solved.filter(s => s.elapsed_seconds != null)
  const avgTime = timeSolves.length > 0
    ? Math.round(timeSolves.reduce((sum, s) => sum + s.elapsed_seconds, 0) / timeSolves.length)
    : null

  // XP = 100 per solve + bonuses
  const totalXp = solved.reduce((sum, s) => {
    let xp = 100
    if (s.elapsed_seconds && s.elapsed_seconds < 120) xp += 50
    else if (s.elapsed_seconds && s.elapsed_seconds < 300) xp += 25
    xp -= (s.hints_used ?? 0) * 15
    xp -= Math.max(0, (s.attempts ?? 1) - 1) * 10
    return sum + Math.max(10, xp)
  }, 0)

  const { level, xpInLevel, xpForLevel } = totalXpToLevel(totalXp)

  // Current streak (consecutive days solved, counting backwards from today)
  const solvedDates = new Set(
    solved.map(s => (s.puzzles as any)?.date_active).filter(Boolean),
  )
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (solvedDates.has(key)) streak++
    else if (i > 0) break
  }

  // Calendar: last 52 weeks
  const solveByDate = new Map(allSolves.map(s => [(s.puzzles as any)?.date_active, s]))
  const calendar: CalendarEntry[] = []
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const s = solveByDate.get(dateStr)
    calendar.push({
      date: dateStr,
      state: s
        ? s.status === 'revealed'
          ? 'gave-up'
          : s.hints_used > 0
          ? 'solved-with-hint'
          : 'solved'
        : null,
    })
  }

  // Recent 8 solves
  const recent = allSolves.slice(0, 8).map(s => ({
    date: (s.puzzles as any)?.date_active ?? '',
    title: (s.puzzles as any)?.title ?? '',
    issue_no: (s.puzzles as any)?.issue_no ?? 0,
    elapsed_seconds: s.elapsed_seconds,
    hints_used: s.hints_used,
    status: s.status,
  }))

  // Genre breakdown
  const genreMap = new Map<string, number>()
  for (const s of solved) {
    const g = (s.puzzles as any)?.genre
    if (g) genreMap.set(g, (genreMap.get(g) ?? 0) + 1)
  }
  const by_genre = Array.from(genreMap.entries()).map(([genre, count]) => ({
    genre: genre as any,
    solved: count,
  }))

  return {
    user,
    settings: settings ?? {
      user_id: userId,
      sound: true,
      show_streak: true,
      hint_pacing: 'instant',
      display_name: null,
    },
    stats: {
      total_solved: totalSolved,
      total_attempted: totalAttempted,
      win_pct: winPct,
      avg_time_seconds: avgTime,
      current_streak: streak,
      xp: totalXp,
      level,
      xp_in_level: xpInLevel,
      xp_for_level: xpForLevel,
    },
    calendar,
    recent,
    by_genre,
  }
}
