import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPuzzleById } from '@/lib/db/puzzles'
import { upsertSolve } from '@/lib/db/solves'
import { getUserBySupabaseId } from '@/lib/db/users'

// Naive IP-based rate limit (in-memory, resets on cold start — good enough without Redis)
const attempts = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT = 20
const WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = attempts.get(ip)
  if (!record || now - record.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now })
    return true
  }
  if (record.count >= RATE_LIMIT) return false
  record.count++
  return true
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body?.answer) {
    return NextResponse.json({ error: 'Missing answer' }, { status: 400 })
  }

  const puzzle = await getPuzzleById(id)
  if (!puzzle) {
    return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 })
  }

  const normalized = String(body.answer).trim().toLowerCase().replace(/[\s,.\-_]/g, '')
  const correct = normalized === puzzle.answer.replace(/[\s,.\-_]/g, '')

  if (correct) {
    // Persist solve for authenticated users
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const user = await getUserBySupabaseId(authUser)
      if (user) {
        await upsertSolve(
          user.id,
          puzzle.id,
          'solved',
          body.elapsed_seconds ?? null,
          body.hints_used ?? 0,
          body.attempts ?? 1,
        )
      }
    }
  }

  // Never return the answer — client already knows it from localStorage on correct
  return NextResponse.json({ correct })
}
