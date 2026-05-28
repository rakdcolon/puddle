import type { GenreBreakdown } from '@/types'

const GENRE_LABELS: Record<string, string> = {
  logic: 'Logic & Deduction',
  quant: 'Quant & Interview',
  pattern: 'Pattern & Sequence',
  lateral: 'Lateral Riddle',
  wordplay: 'Wordplay',
  deduction: 'Deduction',
}

export default function GenreChart({ data }: { data: GenreBreakdown[] }) {
  const max = Math.max(...data.map(d => d.solved), 1)

  if (data.length === 0) {
    return <p className="italic text-ink-muted" style={{ fontSize: 14 }}>No data yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {data
        .sort((a, b) => b.solved - a.solved)
        .map(({ genre, solved }) => (
          <div key={genre}>
            <div className="flex justify-between mb-1">
              <span className="italic text-ink-muted" style={{ fontSize: 13 }}>
                {GENRE_LABELS[genre] ?? genre}
              </span>
              <span
                className="font-medium"
                style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}
              >
                {solved}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: 'var(--color-paper-deep)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(solved / max) * 100}%`,
                  height: '100%',
                  background: 'var(--color-accent)',
                  borderRadius: 3,
                  transition: 'width 0.6s var(--ease-puddle)',
                }}
              />
            </div>
          </div>
        ))}
    </div>
  )
}
