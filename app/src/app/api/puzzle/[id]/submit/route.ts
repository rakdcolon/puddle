import { NextResponse, type NextRequest } from 'next/server'
import { getPuzzleById } from '@/lib/db/puzzles'
import { upsertSolve } from '@/lib/db/solves'
import { upsertAnonSolve } from '@/lib/db/anon-solves'
import { getCurrentUser } from '@/lib/auth/current-user'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
    // Resolve the canonical user from either a website (Supabase) session or a
    // Discord Activity session cookie.
    const user = await getCurrentUser()
    if (user) {
      // Persist solve for authenticated users (Google, Discord, or activity)
      await upsertSolve(
        user.id,
        puzzle.id,
        'solved',
        body.elapsed_seconds ?? null,
        body.hints_used ?? 0,
        body.attempts ?? 1,
      )
    } else if (typeof body.client_id === 'string' && UUID_RE.test(body.client_id)) {
      // Count the anonymous visitor so stats reflect everyone, not just
      // signed-in users. Fire-and-forget — never fail the correctness check.
      await upsertAnonSolve(
        body.client_id,
        puzzle.id,
        'solved',
        body.elapsed_seconds ?? null,
        body.hints_used ?? 0,
        body.attempts ?? 1,
      ).catch(() => {})
    }
  }

  // Never return the answer — client already knows it from localStorage on correct
  return NextResponse.json({ correct })
}
