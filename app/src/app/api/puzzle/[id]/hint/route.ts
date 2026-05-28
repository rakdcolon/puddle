import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPuzzleById } from '@/lib/db/puzzles'
import { updateSolveHints } from '@/lib/db/solves'
import { getUserBySupabaseId } from '@/lib/db/users'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const hintLevel = Number(body?.hint_level)

  if (!hintLevel || hintLevel < 1 || hintLevel > 3) {
    return NextResponse.json({ error: 'hint_level must be 1, 2, or 3' }, { status: 400 })
  }

  const puzzle = await getPuzzleById(id)
  if (!puzzle) {
    return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 })
  }

  const hint = puzzle.hints[hintLevel - 1] ?? null
  if (!hint) {
    return NextResponse.json({ error: 'No hint at that level' }, { status: 404 })
  }

  // Update hints_used for authenticated users
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (authUser) {
    const user = await getUserBySupabaseId(authUser.id)
    if (user) {
      await updateSolveHints(user.id, puzzle.id, hintLevel).catch(() => {})
    }
  }

  return NextResponse.json({ hint })
}
