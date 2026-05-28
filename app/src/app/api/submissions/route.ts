import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Simple IP rate limit: 3 per hour
const submissionTimes = new Map<string, number[]>()
const MAX_PER_HOUR = 3
const HOUR_MS = 3_600_000

function checkSubmissionRateLimit(ip: string): boolean {
  const now = Date.now()
  const times = (submissionTimes.get(ip) ?? []).filter(t => now - t < HOUR_MS)
  if (times.length >= MAX_PER_HOUR) return false
  times.push(now)
  submissionTimes.set(ip, times)
  return true
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkSubmissionRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many submissions — try again later.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { submitter_email, submitter_name, ...rest } = body
  if (!submitter_email || !submitter_name) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('submissions').insert({
    submitter_email,
    submitter_name,
    payload: rest,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
