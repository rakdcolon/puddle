import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPuzzleById } from '@/lib/db/puzzles'
import { getSolveForUser } from '@/lib/db/solves'
import { getUserBySupabaseId } from '@/lib/db/users'
import { getTodayNY } from '@/lib/utils/dates'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const clientState = searchParams.get('state') // 'solved' | 'revealed' — anon trust signal

  const puzzle = await getPuzzleById(id)
  if (!puzzle) {
    return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 })
  }

  // Gate: puzzle must be from yesterday or earlier, OR user has a solve record
  const today = getTodayNY()
  const isPast = puzzle.date_active < today

  if (!isPast) {
    // Check auth
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (authUser) {
      const user = await getUserBySupabaseId(authUser)
      if (user) {
        const solve = await getSolveForUser(user.id, puzzle.id)
        if (!solve) {
          return NextResponse.json({ error: 'Solve the puzzle first' }, { status: 403 })
        }
      }
    } else if (!clientState) {
      // Anonymous with no state param: deny
      return NextResponse.json({ error: 'Solve the puzzle first' }, { status: 403 })
    }
    // Anonymous + state param: honor-system (client writes this after solve/reveal)
  }

  return NextResponse.json({
    solution_lede: puzzle.solution_lede,
    solution_steps: puzzle.solution_steps,
    answer_display: puzzle.answer_display,
  })
}
