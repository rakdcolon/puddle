import { createServiceClient } from '@/lib/supabase/server'
import type { Solve, SolveStatus } from '@/types'

export async function getSolveForUser(userId: string, puzzleId: string): Promise<Solve | null> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('solves')
    .select('*')
    .eq('user_id', userId)
    .eq('puzzle_id', puzzleId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function upsertSolve(
  userId: string,
  puzzleId: string,
  status: SolveStatus,
  elapsedSeconds: number | null,
  hintsUsed: number,
  attempts: number,
): Promise<Solve> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('solves')
    .upsert(
      {
        user_id: userId,
        puzzle_id: puzzleId,
        status,
        elapsed_seconds: elapsedSeconds,
        hints_used: hintsUsed,
        attempts,
        solved_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,puzzle_id' },
    )
    .select()
    .single()

  if (error) throw error
  return data as Solve
}

export async function updateSolveHints(
  userId: string,
  puzzleId: string,
  hintsUsed: number,
): Promise<void> {
  const db = createServiceClient()

  // Upsert a partial 'revealed' record if none exists yet
  await db.from('solves').upsert(
    {
      user_id: userId,
      puzzle_id: puzzleId,
      status: 'revealed',
      hints_used: hintsUsed,
      attempts: 0,
    },
    {
      onConflict: 'user_id,puzzle_id',
      ignoreDuplicates: false,
    },
  )

  // If a row existed, only bump hints_used if it's larger
  await db
    .from('solves')
    .update({ hints_used: hintsUsed })
    .eq('user_id', userId)
    .eq('puzzle_id', puzzleId)
    .lt('hints_used', hintsUsed)
}
