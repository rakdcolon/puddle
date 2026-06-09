import type { Puzzle } from '@/types'
import { PUDDLE_ACCENT } from './interactions'

export const SITE = 'solvepuddle.com'

const GENRE_LABELS: Record<string, string> = {
  logic: 'Logic & Deduction',
  quant: 'Quant & Interview',
  pattern: 'Pattern & Sequence',
  lateral: 'Lateral Riddle',
  wordplay: 'Wordplay',
  deduction: 'Deduction',
}

// The public puzzle card — title, genre, difficulty, and a play link. Never
// includes the answer (same info the website's puzzle page shows). Shared by
// the `/today` slash command and the daily auto-post so they stay identical.
export function dailyPuzzleEmbed(puzzle: Puzzle) {
  const dots = '●'.repeat(puzzle.difficulty) + '○'.repeat(5 - puzzle.difficulty)
  return {
    title: puzzle.title,
    url: `https://${SITE}/puzzle`,
    description: `${GENRE_LABELS[puzzle.genre] ?? puzzle.genre} · ${dots}\n\n[Play today's puzzle →](https://${SITE}/puzzle)`,
    color: PUDDLE_ACCENT,
    footer: { text: `No. ${puzzle.issue_no} · ${SITE}` },
  }
}
