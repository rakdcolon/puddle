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

// The public puzzle card — genre, difficulty, the prompt itself, and a play
// link. Never includes the answer (same info the website's puzzle page shows).
// Shared by the `/today` slash command and the daily auto-post so they stay
// identical.
export function dailyPuzzleEmbed(puzzle: Puzzle) {
  const dots = '●'.repeat(puzzle.difficulty) + '○'.repeat(5 - puzzle.difficulty)
  const genre = GENRE_LABELS[puzzle.genre] ?? puzzle.genre

  // The prompt is public — it's exactly what the puzzle page shows. Quoting it
  // gives Discord readers the actual riddle as the hook to come play.
  const teaser = (puzzle.prompt ?? []).map(line => `> ${line}`).join('\n')
  const description = [teaser, `[Play today's puzzle →](https://${SITE}/puzzle)`]
    .filter(Boolean)
    .join('\n\n')

  return {
    author: { name: `${genre} · ${dots}` },
    title: puzzle.title,
    url: `https://${SITE}/puzzle`,
    description,
    color: PUDDLE_ACCENT,
    thumbnail: { url: `https://${SITE}/apple-icon.png` },
    footer: { text: `No. ${puzzle.issue_no} · ${SITE}` },
  }
}
