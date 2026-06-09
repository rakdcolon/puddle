import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { totalXpToLevel } from '@/lib/utils/xp'
import { nyDateDaysAgo, streakLength } from '@/lib/utils/dates'
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

  const solvedDates = new Set<string>(
    (solves ?? []).map(s => (s.puzzles as any)?.date_active).filter(Boolean),
  )

  // Streak strictly before today (the page adds +1 when today is solved).
  return streakLength(solvedDates, false)
}

export async function getUserById(id: string): Promise<User | null> {
  const db = createServiceClient()
  const { data } = await db.from('users').select('*').eq('id', id).maybeSingle()
  return (data as User) ?? null
}

// Resolve the canonical app user from a raw Discord user ID (snowflake). Used by
// the bot's slash commands, where the only identifier we have is the Discord ID.
// Returns null when that Discord account has never been linked to a Puddle user.
export async function getUserByDiscordSub(discordSub: string): Promise<User | null> {
  const db = createServiceClient()
  const { data } = await db.from('users').select('*').eq('discord_sub', discordSub).maybeSingle()
  return (data as User) ?? null
}

// Top solvers by number of puzzles solved in a recent window (default 7 days),
// for the bot's /leaderboard. Ranks by solve count — not time — in keeping with
// Puddle's no-speed-pressure direction. Anonymous solves are excluded (no name).
// Aggregated in JS since volume is low; avoids a SQL view/RPC.
export async function getLeaderboard(days = 7, limit = 10): Promise<{ display_name: string; solved: number }[]> {
  const db = createServiceClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: solves } = await db
    .from('solves')
    .select('user_id')
    .eq('status', 'solved')
    .gte('solved_at', since)

  const counts = new Map<string, number>()
  for (const s of solves ?? []) counts.set(s.user_id, (counts.get(s.user_id) ?? 0) + 1)

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
  if (top.length === 0) return []

  const { data: users } = await db
    .from('users')
    .select('id, display_name')
    .in('id', top.map(([id]) => id))
  const nameById = new Map((users ?? []).map(u => [u.id, u.display_name]))

  return top.map(([id, solved]) => ({ display_name: nameById.get(id) ?? 'Puzzler', solved }))
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

  const [
    { data: user, error: userError },
    { data: settings },
    { data: solves },
  ] = await Promise.all([
    db.from('users').select('*').eq('id', userId).single(),
    db.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    db
      .from('solves')
      .select('*, puzzles(title, issue_no, genre, date_active)')
      .eq('user_id', userId)
      .order('solved_at', { ascending: false }),
  ])

  if (userError) throw userError
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
    xp -= (s.hints_used ?? 0) * 15
    xp -= Math.max(0, (s.attempts ?? 1) - 1) * 10
    return sum + Math.max(10, xp)
  }, 0)

  const { level, xpInLevel, xpForLevel } = totalXpToLevel(totalXp)

  // Current streak (consecutive days solved, counting backwards from today,
  // including today when it has been solved).
  const solvedDates = new Set<string>(
    solved.map(s => (s.puzzles as any)?.date_active).filter(Boolean),
  )
  const streak = streakLength(solvedDates, true)

  // Calendar: last 365 days (52 weeks + 1 day)
  const solveByDate = new Map(allSolves.map(s => [(s.puzzles as any)?.date_active, s]))
  const calendar: CalendarEntry[] = []
  for (let i = 364; i >= 0; i--) {
    const dateStr = nyDateDaysAgo(i)
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
