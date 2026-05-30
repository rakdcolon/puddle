#!/usr/bin/env node
/**
 * Sync the puzzles/ directory to Supabase.
 *
 * Treats the JSON files in ../puzzles as the source of truth:
 *   - upserts every file on issue_no (clearing deleted_at if previously soft-deleted)
 *   - soft-deletes any DB row whose issue_no is no longer present locally
 *
 * Usage (from app/):
 *   node scripts/sync-puzzles.mjs            # apply
 *   node scripts/sync-puzzles.mjs --dry-run  # preview only
 *   npm run sync-puzzles
 *   npm run sync-puzzles -- --dry-run
 *
 * Reads credentials from .env.local automatically.
 */

import { readFileSync, readdirSync } from 'fs'
import { resolve, join, basename } from 'path'
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')
const PUZZLES_DIR = resolve(process.cwd(), '..', 'puzzles')

// ─── Load .env.local ──────────────────────────────────────────────────────────
try {
  const content = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // rely on env vars already set in shell / CI
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// ─── Load + validate every puzzle JSON ────────────────────────────────────────
const REQUIRED = [
  'issue_no', 'vol', 'date_active', 'title', 'genre', 'difficulty',
  'prompt', 'answer', 'answer_display', 'hints', 'solution_lede',
  'solution_steps', 'input_type',
]

const files = readdirSync(PUZZLES_DIR)
  .filter(f => f.endsWith('.json') && f !== 'template.json')
  .sort()

const puzzles = []
const errors = []
const seenIssueNos = new Map() // issue_no → filename, to catch duplicates

for (const file of files) {
  const path = join(PUZZLES_DIR, file)
  let puzzle
  try {
    puzzle = JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    errors.push(`${file}: invalid JSON — ${err.message}`)
    continue
  }
  const missing = REQUIRED.filter(f => puzzle[f] === undefined)
  if (missing.length) {
    errors.push(`${file}: missing required fields: ${missing.join(', ')}`)
    continue
  }
  const prior = seenIssueNos.get(puzzle.issue_no)
  if (prior) {
    errors.push(`${file}: duplicate issue_no ${puzzle.issue_no} (also in ${prior})`)
    continue
  }
  seenIssueNos.set(puzzle.issue_no, file)

  puzzle.answer = puzzle.answer.trim().toLowerCase()
  puzzle.deleted_at = null // resurrect on re-add
  puzzles.push({ file, puzzle })
}

if (errors.length) {
  console.error('Validation failed:')
  for (const e of errors) console.error('  - ' + e)
  process.exit(1)
}

const localIssueNos = new Set(puzzles.map(p => p.puzzle.issue_no))

// ─── Diff against DB ──────────────────────────────────────────────────────────
const db = createClient(url, key)

const { data: existing, error: fetchErr } = await db
  .from('puzzles')
  .select('id, issue_no, title, deleted_at')

if (fetchErr) {
  console.error('Could not read puzzles table:', fetchErr.message)
  process.exit(1)
}

const existingByIssueNo = new Map(existing.map(r => [r.issue_no, r]))

const toCreate = []
const toUpdate = []
const toRestore = []
for (const { file, puzzle } of puzzles) {
  const cur = existingByIssueNo.get(puzzle.issue_no)
  if (!cur) toCreate.push({ file, puzzle })
  else if (cur.deleted_at) toRestore.push({ file, puzzle, cur })
  else toUpdate.push({ file, puzzle, cur })
}

const toSoftDelete = existing.filter(
  r => !r.deleted_at && !localIssueNos.has(r.issue_no),
)

// ─── Summary ──────────────────────────────────────────────────────────────────
const banner = DRY_RUN ? '── DRY RUN ──' : '── SYNC ──'
console.log(banner)
console.log(`  create:       ${toCreate.length}`)
console.log(`  update:       ${toUpdate.length}`)
console.log(`  restore:      ${toRestore.length}`)
console.log(`  soft-delete:  ${toSoftDelete.length}`)

const log = (label, items, fmt) => {
  if (!items.length) return
  console.log(`\n${label}:`)
  for (const item of items) console.log('  ' + fmt(item))
}
log('Create',      toCreate,     i => `No. ${i.puzzle.issue_no} — "${i.puzzle.title}"  (${i.file})`)
log('Update',      toUpdate,     i => `No. ${i.puzzle.issue_no} — "${i.puzzle.title}"`)
log('Restore',     toRestore,    i => `No. ${i.puzzle.issue_no} — "${i.puzzle.title}"`)
log('Soft-delete', toSoftDelete, r => `No. ${r.issue_no} — "${r.title}"`)

if (DRY_RUN) {
  console.log('\nDry run — no changes applied.')
  process.exit(0)
}

if (!toCreate.length && !toUpdate.length && !toRestore.length && !toSoftDelete.length) {
  console.log('\nNothing to do.')
  process.exit(0)
}

// ─── Apply ────────────────────────────────────────────────────────────────────
if (puzzles.length) {
  const { error } = await db
    .from('puzzles')
    .upsert(puzzles.map(p => p.puzzle), { onConflict: 'issue_no' })
  if (error) {
    console.error('\nUpsert failed:', error.message)
    process.exit(1)
  }
}

if (toSoftDelete.length) {
  const { error } = await db
    .from('puzzles')
    .update({ deleted_at: new Date().toISOString() })
    .in('issue_no', toSoftDelete.map(r => r.issue_no))
  if (error) {
    console.error('\nSoft-delete failed:', error.message)
    process.exit(1)
  }
}

console.log('\nDone.')
