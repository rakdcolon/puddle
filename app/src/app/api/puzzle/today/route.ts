import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPuzzleForDate, stripAnswer, getPuzzleStats } from '@/lib/db/puzzles'
import { getSolveForUser } from '@/lib/db/solves'
import { getUserBySupabaseId } from '@/lib/db/users'
import { getTodayNY } from '@/lib/utils/dates'

export const dynamic = 'force-dynamic'

export async function GET() {
  const today = getTodayNY()
  const puzzle = await getPuzzleForDate(today)

  if (!puzzle) {
    return NextResponse.json({ error: 'No puzzle today' }, { status: 404 })
  }

  const [stats, userSolve] = await Promise.all([
    getPuzzleStats(puzzle.id),
    (async () => {
      const supabase = await createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return null
      const user = await getUserBySupabaseId(authUser.id)
      if (!user) return null
      return getSolveForUser(user.id, puzzle.id)
    })(),
  ])

  return NextResponse.json({
    puzzle: stripAnswer(puzzle),
    solve: userSolve,
    stats,
  })
}
