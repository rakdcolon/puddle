export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import PuzzleApp, { type PuzzleSettings } from '@/components/puzzle/PuzzleApp'
import { createServiceClient } from '@/lib/supabase/server'
import { getPuzzleForDate } from '@/lib/db/puzzles'
import { getSolveForUser } from '@/lib/db/solves'
import { getCurrentStreak, getXPBeforeToday } from '@/lib/db/users'
import { getCurrentUser } from '@/lib/auth/current-user'
import { getTodayNY } from '@/lib/utils/dates'
import type { Solve } from '@/types'

export const metadata = { title: "Today's puzzle — puddle" }

export default async function PuzzlePage() {
  const today = getTodayNY()
  const puzzle = await getPuzzleForDate(today)
  if (!puzzle) notFound()

  // Strip answer before passing to client
  const { answer: _answer, solution_lede: _lede, solution_steps: _steps, ...publicPuzzle } = puzzle

  let initialSolve: Solve | null = null
  let streakBeforeToday: number | undefined
  let xpBeforeToday: { totalXp: number; level: number } | undefined
  let settings: PuzzleSettings | undefined
  const user = await getCurrentUser()
  if (user) {
    const db = createServiceClient()
    const [solve, streak, xp, settingsRes] = await Promise.all([
      getSolveForUser(user.id, puzzle.id),
      getCurrentStreak(user.id),
      getXPBeforeToday(user.id, today),
      db.from('user_settings').select('sound, show_streak, hint_pacing').eq('user_id', user.id).maybeSingle(),
    ])
    initialSolve = solve
    streakBeforeToday = streak
    xpBeforeToday = xp
    const s = settingsRes.data
    settings = {
      sound: s?.sound ?? true,
      show_streak: s?.show_streak ?? true,
      // Validate at runtime rather than asserting the DB value's type.
      hint_pacing: s?.hint_pacing === '5s-pause' ? '5s-pause' : 'instant',
    }
  }

  return (
    <PuzzleApp
      puzzle={publicPuzzle}
      initialSolve={initialSolve}
      issueNo={puzzle.issue_no}
      vol={puzzle.vol}
      streakBeforeToday={streakBeforeToday}
      xpBeforeToday={xpBeforeToday}
      settings={settings}
    />
  )
}
