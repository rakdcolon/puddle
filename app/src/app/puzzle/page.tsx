export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import PuzzleApp from '@/components/puzzle/PuzzleApp'
import { createClient } from '@/lib/supabase/server'
import { getPuzzleForDate } from '@/lib/db/puzzles'
import { getSolveForUser } from '@/lib/db/solves'
import { getUserBySupabaseId } from '@/lib/db/users'
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
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (authUser) {
    const user = await getUserBySupabaseId(authUser)
    if (user) {
      initialSolve = await getSolveForUser(user.id, puzzle.id)
    }
  }

  return (
    <div className="h-screen overflow-hidden">
      <PuzzleApp
        puzzle={publicPuzzle}
        initialSolve={initialSolve}
        issueNo={puzzle.issue_no}
        vol={puzzle.vol}
      />
    </div>
  )
}
