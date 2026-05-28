#!/usr/bin/env node
/**
 * Import a puzzle JSON file into Supabase.
 *
 * Usage (from repo root):
 *   cd app && node scripts/import-puzzle.mjs ../puzzles/my-puzzle.json
 *
 * Or via npm script:
 *   cd app && npm run import-puzzle -- ../puzzles/my-puzzle.json
 *
 * Reads credentials from .env.local automatically.
 * Uses issue_no as the upsert key — safe to re-run to update an existing puzzle.
 */

import { readFileSync } from 'fs'
import { resolve, join } from 'path'
import { createClient } from '@supabase/supabase-js'

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
  // rely on env vars already set in shell
}

// ─── Validate env ─────────────────────────────────────────────────────────────
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Set them in .env.local or export them in your shell.')
  process.exit(1)
}

// ─── Read puzzle file ─────────────────────────────────────────────────────────
const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node scripts/import-puzzle.mjs <path-to-puzzle.json>')
  process.exit(1)
}

let puzzle
try {
  puzzle = JSON.parse(readFileSync(resolve(filePath), 'utf8'))
} catch (err) {
  console.error(`Could not read ${filePath}: ${err.message}`)
  process.exit(1)
}

// ─── Validate required fields ─────────────────────────────────────────────────
const REQUIRED = [
  'issue_no', 'vol', 'date_active', 'title', 'genre', 'difficulty',
  'prompt', 'answer', 'answer_display', 'hints', 'solution_lede',
  'solution_steps', 'input_type',
]
const missing = REQUIRED.filter(f => puzzle[f] === undefined)
if (missing.length) {
  console.error('Missing required fields:', missing.join(', '))
  process.exit(1)
}

puzzle.answer = puzzle.answer.trim().toLowerCase()

// ─── Upsert ───────────────────────────────────────────────────────────────────
const db = createClient(url, key)
const { data, error } = await db
  .from('puzzles')
  .upsert(puzzle, { onConflict: 'issue_no' })
  .select('id, issue_no, title')
  .single()

if (error) {
  console.error('Import failed:', error.message)
  process.exit(1)
}

console.log(`✓  No. ${data.issue_no} — "${data.title}"  (${data.id})`)
