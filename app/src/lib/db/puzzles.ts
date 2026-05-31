import { createServiceClient } from '@/lib/supabase/server'
import type { Puzzle, PublicPuzzle, PuzzleStats } from '@/types'
import { unstable_cache } from 'next/cache'

export async function getPuzzleForDate(dateStr: string): Promise<Puzzle | null> {
  const db = createServiceClient()
  // The most recent puzzle published on or before the requested date. Using a
  // "latest on-or-before" lookup (rather than an exact date match) means a gap
  // in the daily schedule keeps the previous issue live instead of 404-ing the
  // whole site. Callers pass today (NY), so future-dated puzzles are excluded.
  const { data, error } = await db
    .from('puzzles')
    .select('*')
    .lte('date_active', dateStr)
    .is('deleted_at', null)
    .order('date_active', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as Puzzle
}

export async function getPuzzleById(id: string): Promise<Puzzle | null> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('puzzles')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !data) return null
  return data as Puzzle
}

// The current (latest published) issue's number/volume, for the masthead on
// pages that aren't displaying a specific puzzle.
export async function getCurrentIssue(): Promise<{ issueNo: number; vol: number } | null> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('puzzles')
    .select('issue_no, vol')
    .lte('date_active', new Date().toISOString().slice(0, 10))
    .is('deleted_at', null)
    .order('date_active', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return { issueNo: data.issue_no, vol: data.vol }
}

export function stripAnswer(puzzle: Puzzle): PublicPuzzle {
  const { answer: _answer, solution_lede: _lede, solution_steps: _steps, ...pub } = puzzle
  return pub
}

export const getPuzzleStats = unstable_cache(
  async (puzzleId: string): Promise<PuzzleStats> => {
    const db = createServiceClient()

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

    // Stats count both signed-in (solves) and anonymous (anon_solves) visitors.
    const [
      { data: allSolves },
      { data: recentSolves },
      { data: allAnon },
      { data: recentAnon },
    ] = await Promise.all([
      db.from('solves').select('elapsed_seconds, status').eq('puzzle_id', puzzleId),
      db.from('solves').select('puzzle_id').eq('puzzle_id', puzzleId).gte('solved_at', threeHoursAgo),
      db.from('anon_solves').select('elapsed_seconds, status').eq('puzzle_id', puzzleId),
      db.from('anon_solves').select('puzzle_id').eq('puzzle_id', puzzleId).gte('solved_at', threeHoursAgo),
    ])

    const all = [...(allSolves ?? []), ...(allAnon ?? [])]
    const solved = all.filter(s => s.status === 'solved' && s.elapsed_seconds != null)
    const times = solved.map(s => s.elapsed_seconds as number).sort((a, b) => a - b)

    return {
      total_solved: all.filter(s => s.status === 'solved').length,
      best_time_seconds: times[0] ?? null,
      avg_time_seconds: times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : null,
      active_solvers: (recentSolves ?? []).length + (recentAnon ?? []).length,
    }
  },
  ['puzzle-stats'],
  { revalidate: 30 },
)
