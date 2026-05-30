import { createServiceClient } from '@/lib/supabase/server'
import type { SolveStatus } from '@/types'

// Records a solve by a non-signed-in visitor, keyed by a random browser-local
// client_id. Idempotent per (client_id, puzzle_id) — a refresh or re-submit
// updates the existing row instead of double-counting the visitor.
export async function upsertAnonSolve(
  clientId: string,
  puzzleId: string,
  status: SolveStatus,
  elapsedSeconds: number | null,
  hintsUsed: number,
  attempts: number,
): Promise<void> {
  const db = createServiceClient()
  const { error } = await db.from('anon_solves').upsert(
    {
      client_id: clientId,
      puzzle_id: puzzleId,
      status,
      elapsed_seconds: elapsedSeconds,
      hints_used: hintsUsed,
      attempts,
      solved_at: new Date().toISOString(),
    },
    { onConflict: 'client_id,puzzle_id' },
  )
  if (error) throw error
}
