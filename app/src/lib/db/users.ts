import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { totalXpToLevel } from '@/lib/utils/xp'
import type { User, UserProfile, CalendarEntry } from '@/types'

// Look up our internal user by Supabase auth UID (google_sub)
export async function getUserBySupabaseId(supabaseUid: string): Promise<User | null> {
  const db = createServiceClient()
  // Try by google_sub first (Google OAuth sets sub = supabase user id)
  const { data } = await db
    .from('users')
    .select('*')
    .eq('google_sub', supabaseUid)
    .maybeSingle()
  return data ?? null
}

export async function getOrCreateUser(supabaseUser: SupabaseUser) {
  const db = createServiceClient()

  const googleSub = supabaseUser.user_metadata?.sub ?? supabaseUser.id
  const displayName =
    supabaseUser.user_metadata?.full_name ??
    supabaseUser.user_metadata?.name ??
    supabaseUser.email?.split('@')[0] ??
    'Puzzler'
  const email = supabaseUser.email ?? ''

  // Upsert user
  const { data: user, error } = await db
    .from('users')
    .upsert(
      { google_sub: googleSub, display_name: displayName, email },
      { onConflict: 'google_sub', ignoreDuplicates: false },
    )
    .select()
    .single()

  if (error) throw error

  // Ensure settings row exists
  await db
    .from('user_settings')
    .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })

  return user
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
