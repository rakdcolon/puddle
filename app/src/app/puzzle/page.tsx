export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import PuzzleApp from '@/components/puzzle/PuzzleApp'
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
  const user = await getCurrentUser()
  if (user) {
    ;[initialSolve, streakBeforeToday, xpBeforeToday] = await Promise.all([
      getSolveForUser(user.id, puzzle.id),
      getCurrentStreak(user.id),
      getXPBeforeToday(user.id, today),
    ])
  }

  return (
    <PuzzleApp
      puzzle={publicPuzzle}
      initialSolve={initialSolve}
      issueNo={puzzle.issue_no}
      vol={puzzle.vol}
      streakBeforeToday={streakBeforeToday}
      xpBeforeToday={xpBeforeToday}
    />
  )
}
