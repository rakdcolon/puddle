import type { SupabaseClient } from '@supabase/supabase-js'

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
// issue_no, which is also the upsert conflict key) is rejected up front rather
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
  const seenIssueNos = new Map<number, string>()

  for (const { name, content } of files) {
    if (!name.endsWith('.json') || name === 'template.json') continue

    let puzzle: Record<string, unknown>
    try {
      puzzle = JSON.parse(content)
    } catch (err) {
      errors.push(`${name}: invalid JSON — ${(err as Error).message}`)
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

    const issueNo = puzzle.issue_no as number
    const prior = seenIssueNos.get(issueNo)
    if (prior) {
      errors.push(`${name}: duplicate issue_no ${issueNo} (also in ${prior})`)
      continue
    }
    seenIssueNos.set(issueNo, name)

    puzzle.answer = String(puzzle.answer).trim().toLowerCase()
    puzzle.deleted_at = null // resurrect on re-add
    puzzles.push(puzzle)
  }

  return { puzzles, errors }
}

// Diff the validated puzzles against the DB and apply: upsert every puzzle on
// issue_no (clearing deleted_at), and soft-delete any row whose issue_no is no
// longer present. Pass dryRun to compute the summary without writing.
export async function applyPuzzleSync(
  db: SupabaseClient,
  puzzles: Record<string, unknown>[],
  opts: { dryRun?: boolean } = {},
): Promise<SyncSummary> {
  const localIssueNos = new Set(puzzles.map(p => p.issue_no as number))

  const { data: existing, error: fetchErr } = await db
    .from('puzzles')
    .select('id, issue_no, deleted_at')
  if (fetchErr) throw new Error(`read puzzles: ${fetchErr.message}`)

  const rows = existing ?? []
  const byIssueNo = new Map(rows.map(r => [r.issue_no, r]))

  let created = 0
  let updated = 0
  let restored = 0
  for (const p of puzzles) {
    const cur = byIssueNo.get(p.issue_no as number)
    if (!cur) created++
    else if (cur.deleted_at) restored++
    else updated++
  }
  const toSoftDelete = rows.filter(
    r => !r.deleted_at && !localIssueNos.has(r.issue_no),
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
    const { error } = await db.from('puzzles').upsert(puzzles, { onConflict: 'issue_no' })
    if (error) throw new Error(`upsert: ${error.message}`)
  }
  if (toSoftDelete.length) {
    const { error } = await db
      .from('puzzles')
      .update({ deleted_at: new Date().toISOString() })
      .in('issue_no', toSoftDelete.map(r => r.issue_no))
    if (error) throw new Error(`soft-delete: ${error.message}`)
  }

  return summary
}
