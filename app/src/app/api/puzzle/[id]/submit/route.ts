import { NextResponse, type NextRequest } from 'next/server'
import { getPuzzleById } from '@/lib/db/puzzles'
import { upsertSolve, markRevealed } from '@/lib/db/solves'
import { upsertAnonSolve, markAnonRevealed } from '@/lib/db/anon-solves'
import { getCurrentUser } from '@/lib/auth/current-user'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Coerce untrusted numeric body fields to safe, in-range column values
// (hints_used/attempts are SMALLINT; elapsed_seconds is INT).
function smallint(v: unknown, fallback = 0): number {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 32767) : fallback
}
function intOrNull(v: unknown): number | null {
  if (v == null) return null
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 2_147_483_647) : null
}

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
  if (!body) {
    return NextResponse.json({ error: 'Missing body' }, { status: 400 })
  }

  const puzzle = await getPuzzleById(id)
  if (!puzzle) {
    return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 })
  }

  // Give-up / reveal: persist a 'revealed' record for signed-in and anonymous
  // players (no answer required). Insert-if-absent, so it never overwrites an
  // existing solve. Without this, give-ups vanish and solve-rate is unknowable.
  if (body.status === 'revealed') {
    const user = await getCurrentUser()
    const elapsed = intOrNull(body.elapsed_seconds)
    const hints = smallint(body.hints_used)
    const att = smallint(body.attempts)
    try {
      if (user) {
        await markRevealed(user.id, puzzle.id, elapsed, hints, att)
      } else if (typeof body.client_id === 'string' && UUID_RE.test(body.client_id)) {
        await markAnonRevealed(body.client_id, puzzle.id, elapsed, hints, att)
      }
      return NextResponse.json({ revealed: true })
    } catch (err) {
      // Unlike the answer path (where a DB hiccup must never make a correct
      // answer look wrong), the client ignores this response, so surface the
      // failure honestly for logs/alerting instead of falsely claiming success.
      return NextResponse.json(
        { revealed: false, error: err instanceof Error ? err.message : 'persist failed' },
        { status: 500 },
      )
    }
  }

  if (!body.answer) {
    return NextResponse.json({ error: 'Missing answer' }, { status: 400 })
  }

  const normalized = String(body.answer).trim().toLowerCase().replace(/[\s,.\-_]/g, '')
  const correct = normalized === puzzle.answer.replace(/[\s,.\-_]/g, '')

  if (correct) {
    // Resolve the canonical user from either a website (Supabase) session or a
    // Discord Activity session cookie.
    const user = await getCurrentUser()
    const elapsed = intOrNull(body.elapsed_seconds)
    const hints = smallint(body.hints_used)
    const att = smallint(body.attempts, 1)
    if (user) {
      // Persist solve for authenticated users. DB errors must never cause a
      // correct answer to appear wrong — catch and swallow.
      await upsertSolve(user.id, puzzle.id, 'solved', elapsed, hints, att).catch(() => {})
    } else if (typeof body.client_id === 'string' && UUID_RE.test(body.client_id)) {
      // Count the anonymous visitor so stats reflect everyone, not just
      // signed-in users. Fire-and-forget — never fail the correctness check.
      await upsertAnonSolve(body.client_id, puzzle.id, 'solved', elapsed, hints, att).catch(() => {})
    }
  }

  // Never return the answer — client already knows it from localStorage on correct
  return NextResponse.json({ correct })
}
