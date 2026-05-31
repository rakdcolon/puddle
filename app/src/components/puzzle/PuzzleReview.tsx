import type { PublicPuzzle, ChoiceConfig } from '@/types'

// Read-only rendering of a puzzle — its prompt and, for multiple-choice
// puzzles, the answer options. Mirrors PuzzleApp's prompt/choice styling but
// strips every interactive affordance: no inputs, no submit, no hints/give-up.
// Used on /review so a solver can re-read the puzzle without re-answering it.

const GENRE_LABELS: Record<string, string> = {
  logic: 'Logic & Deduction',
  quant: 'Quant & Interview',
  pattern: 'Pattern & Sequence',
  lateral: 'Lateral Riddle',
  wordplay: 'Wordplay',
  deduction: 'Deduction',
}

export default function PuzzleReview({ puzzle }: { puzzle: PublicPuzzle }) {
  const choices =
    puzzle.input_type === 'choice'
      ? (puzzle.input_config as ChoiceConfig | null)?.options ?? []
      : []

  return (
    <div style={{ fontFeatureSettings: '"ss01","cv02"' }}>
      {/* Kicker: genre + difficulty */}
      <div className="flex items-center gap-3 mb-2">
        <span className="italic text-accent tracking-[0.1px]" style={{ fontSize: 14 }}>
          {GENRE_LABELS[puzzle.genre] ?? puzzle.genre}
        </span>
        <span className="text-hair-strong">·</span>
        <span className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <span
              key={n}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--color-accent)',
                opacity: n <= puzzle.difficulty ? 1 : 0.18,
                display: 'inline-block',
              }}
            />
          ))}
        </span>
      </div>

      {/* Title */}
      <h1
        className="font-medium leading-[1.06] tracking-tight mb-5"
        style={{ fontSize: 40, letterSpacing: -0.8, color: 'var(--color-ink)' }}
      >
        {puzzle.title}
      </h1>

      {/* Prompt */}
      <div className="my-5 max-w-[640px]" style={{ fontSize: 19, lineHeight: 1.6, color: 'var(--color-ink)' }}>
        {puzzle.prompt.map((para, i) => {
          const isDataLine = i === 1 && puzzle.input_type !== 'freetext'
          return (
            <p
              key={i}
              className="mb-3"
              style={
                isDataLine
                  ? {
                      fontFamily: '"Crimson Pro", Georgia, serif',
                      fontVariantNumeric: 'tabular-nums',
                      background: 'var(--color-paper)',
                      border: '1px solid var(--color-hair)',
                      borderRadius: 10,
                      padding: '14px 20px',
                      fontSize: 22,
                    }
                  : undefined
              }
            >
              {para}
            </p>
          )
        })}
      </div>

      {/* Answer choices (read-only, multiple choice only) */}
      {choices.length > 0 && (
        <div className="max-w-[640px] mt-6">
          <span className="italic text-ink-muted" style={{ fontSize: 13 }}>
            Answer choices
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mt-3">
            {choices.map((opt, i) => (
              <div
                key={opt}
                style={{
                  background: 'var(--color-paper)',
                  color: 'var(--color-ink)',
                  border: '1px solid var(--color-hair-strong)',
                  borderRadius: 14,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  className="font-medium"
                  style={{ fontSize: 11, letterSpacing: '0.5px', opacity: 0.55, color: 'var(--color-ink-muted)' }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ fontSize: 22, fontWeight: 500 }}>{opt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
