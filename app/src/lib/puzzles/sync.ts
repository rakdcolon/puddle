import type { SupabaseClient } from '@supabase/supabase-js'
import { assertCalendarEdition } from './numbering.mjs'

// The puzzle JSON files are the source of truth. This module holds the
// source-agnostic core — validation, diff, and apply — shared shape with the
// local `scripts/sync-puzzles.mjs`. The cron route feeds it files pulled from
// GitHub; the script feeds it files read off disk.

export const REQUIRED_FIELDS = [
  'issue_no', 'vol', 'date_active', 'title', 'genre', 'difficulty',
  'prompt', 'answer', 'answer_display', 'hints', 'solution_lede',
  'solution_steps', 'input_type',
] as const

// Expected type of each required field, so a malformed value (e.g. a string
// issue_no) is rejected up front rather
// than corrupting the diff or the write.
const FIELD_TYPES: Record<string, 'string' | 'number' | 'array'> = {
  issue_no: 'number', vol: 'number', difficulty: 'number',
  date_active: 'string', title: 'string', genre: 'string',
  answer: 'string', answer_display: 'string', solution_lede: 'string',
  input_type: 'string',
  prompt: 'array', hints: 'array', solution_steps: 'array',
}

function typeOk(value: unknown, kind: 'string' | 'number' | 'array'): boolean {
  if (kind === 'array') return Array.isArray(value)
  if (kind === 'number') return typeof value === 'number' && Number.isFinite(value)
  return typeof value === 'string'
}

export interface RawPuzzleFile {
  name: string
  content: string
}

export interface SyncSummary {
  total: number
  created: number
  updated: number
  restored: number
  softDeleted: number
}

// Parse + validate raw files into puzzle rows. Skips template.json and
// non-JSON. Returns collected errors instead of throwing so the caller can
// refuse to touch the DB when anything is malformed.
export function parseAndValidate(files: RawPuzzleFile[]): {
  puzzles: Record<string, unknown>[]
  errors: string[]
} {
  const puzzles: Record<string, unknown>[] = []
  const errors: string[] = []
  const seenDates = new Map<string, string>()

  for (const { name, content } of files) {
    if (!name.endsWith('.json') || name === 'template.json') continue

    let puzzle: Record<string, unknown>
    try {
      puzzle = JSON.parse(content)
    } catch (err) {
      errors.push(`${name}: invalid JSON — ${(err as Error).message}`)
      continue
    }

    if (!puzzle || typeof puzzle !== 'object' || Array.isArray(puzzle)) {
      errors.push(`${name}: expected a puzzle object`)
      continue
    }
    const missing = REQUIRED_FIELDS.filter(f => puzzle[f] === undefined)
    if (missing.length) {
      errors.push(`${name}: missing required fields: ${missing.join(', ')}`)
      continue
    }

    const typeErrors = Object.entries(FIELD_TYPES)
      .filter(([field, kind]) => !typeOk(puzzle[field], kind))
      .map(([field, kind]) => `${field} must be a ${kind}`)
    if (typeErrors.length) {
      errors.push(`${name}: ${typeErrors.join('; ')}`)
      continue
    }

    try { assertCalendarEdition(puzzle as {date_active: string; vol: number; issue_no: number}) }
    catch (error) { errors.push(`${name}: ${(error as Error).message}`); continue }
    const date = puzzle.date_active as string
    const prior = seenDates.get(date)
    if (prior) {
      errors.push(`${name}: duplicate date_active ${date} (also in ${prior})`)
      continue
    }
    seenDates.set(date, name)

    puzzle.answer = String(puzzle.answer).trim().toLowerCase()
    puzzle.deleted_at = null // resurrect on re-add
    puzzles.push(puzzle)
  }

  return { puzzles, errors }
}

// Diff the validated puzzles against the DB and apply: upsert every puzzle on
// date_active (preserving UUIDs and clearing deleted_at), and soft-delete any row whose date is no
// longer present. Pass dryRun to compute the summary without writing.
export async function applyPuzzleSync(
  db: SupabaseClient,
  puzzles: Record<string, unknown>[],
  opts: { dryRun?: boolean } = {},
): Promise<SyncSummary> {
  if (!puzzles.length) throw new Error('Refusing to reconcile an empty puzzle archive')
  const localDates = new Set(puzzles.map(p => p.date_active as string))

  const { data: existing, error: fetchErr } = await db
    .from('puzzles')
    .select('id, date_active, deleted_at')
  if (fetchErr) throw new Error(`read puzzles: ${fetchErr.message}`)

  const rows = existing ?? []
  const byDate = new Map(rows.map(r => [r.date_active, r]))

  let created = 0
  let updated = 0
  let restored = 0
  for (const p of puzzles) {
    const cur = byDate.get(p.date_active as string)
    if (!cur) created++
    else if (cur.deleted_at) restored++
    else updated++
  }
  const toSoftDelete = rows.filter(
    r => !r.deleted_at && !localDates.has(r.date_active),
  )

  const summary: SyncSummary = {
    total: puzzles.length,
    created,
    updated,
    restored,
    softDeleted: toSoftDelete.length,
  }

  if (opts.dryRun) return summary

  if (puzzles.length) {
    const { error } = await db.from('puzzles').upsert(puzzles, { onConflict: 'date_active' })
    if (error) throw new Error(`upsert: ${error.message}`)
  }
  if (toSoftDelete.length) {
    const { error } = await db
      .from('puzzles')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', toSoftDelete.map(r => r.id))
    if (error) throw new Error(`soft-delete: ${error.message}`)
  }

  return summary
}
