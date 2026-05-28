import { NextResponse, type NextRequest } from 'next/server'
import { getPuzzleStats } from '@/lib/db/puzzles'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const stats = await getPuzzleStats(id)
  return NextResponse.json(stats)
}
