import type { PublicPuzzle, Solve, PuzzleStats } from '@/types'
import { formatDate, formatElapsed } from '@/lib/utils/dates'
import Link from 'next/link'

interface PuzzleCardProps {
  puzzle: PublicPuzzle
  solve: Solve | null
  stats: PuzzleStats
}

export default function PuzzleCard({ puzzle, solve, stats }: PuzzleCardProps) {
  const dateLabel = formatDate(puzzle.date_active)
  const genreLabels: Record<string, string> = {
    logic: 'Logic & Deduction',
    quant: 'Quant & Interview',
    pattern: 'Pattern & Sequence',
    lateral: 'Lateral Riddle',
    wordplay: 'Wordplay',
    deduction: 'Deduction',
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: 'var(--color-paper)',
        borderRadius: 18,
        boxShadow: 'var(--shadow-card)',
        padding: '28px 30px 32px',
      }}
    >
      {/* Issue number watermark */}
      <span
        aria-hidden="true"
        className="absolute bottom-4 right-5 font-medium italic select-none pointer-events-none"
        style={{
          fontSize: 'clamp(140px, 18vw, 220px)',
          lineHeight: 1,
          color: 'var(--color-paper-deep)',
          zIndex: 0,
          letterSpacing: -4,
        }}
      >
        {puzzle.issue_no}
      </span>

      <div className="relative" style={{ zIndex: 1 }}>
        {solve?.status === 'solved' ? (
          <SolvedState puzzle={puzzle} solve={solve} dateLabel={dateLabel} />
        ) : solve?.status === 'revealed' ? (
          <RevealedState puzzle={puzzle} dateLabel={dateLabel} />
        ) : (
          <DefaultState puzzle={puzzle} stats={stats} dateLabel={dateLabel} genreLabels={genreLabels} />
        )}
      </div>
    </div>
  )
}

function DefaultState({ puzzle, stats, dateLabel, genreLabels }: {
  puzzle: PublicPuzzle
  stats: PuzzleStats
  dateLabel: string
  genreLabels: Record<string, string>
}) {
  return (
    <>
      {/* Stamp */}
      <div className="flex items-center gap-2 mb-5">
        <span
          className="animate-pulse-soft inline-block"
          style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }}
        />
        <span className="italic text-ink-muted" style={{ fontSize: 13 }}>
          Today — {dateLabel}
        </span>
      </div>

      {/* Eyebrow */}
      <div className="flex items-center gap-2 mb-3">
        <span className="italic text-accent" style={{ fontSize: 13 }}>
          {genreLabels[puzzle.genre] ?? puzzle.genre}
        </span>
        <span className="text-hair-strong">·</span>
        <span className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <span
              key={n}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--color-accent)',
                opacity: n <= puzzle.difficulty ? 1 : 0.18,
                display: 'inline-block',
              }}
            />
          ))}
        </span>
      </div>

      <h2
        className="font-medium leading-[1.06] mb-3"
        style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', letterSpacing: -0.6 }}
      >
        {puzzle.title}
      </h2>

      <p className="italic text-ink-muted leading-relaxed mb-7" style={{ fontSize: 16 }}>
        {puzzle.prompt[0].slice(0, 120)}{puzzle.prompt[0].length > 120 ? '…' : ''}
      </p>

      <Link
        href="/puzzle"
        className="inline-flex items-center gap-2 font-medium no-underline transition-all duration-[180ms] hover:-translate-y-px group"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          borderRadius: 14,
          padding: '13px 22px',
          fontSize: 16,
          boxShadow: 'var(--shadow-btn)',
          fontFamily: 'inherit',
        }}
      >
        Begin today's puzzle
        <span className="transition-transform duration-[250ms] group-hover:translate-x-[3px]">→</span>
      </Link>

      {stats.avg_time_seconds && (
        <p className="italic text-ink-muted mt-3" style={{ fontSize: 13 }}>
          avg. {formatElapsed(stats.avg_time_seconds)} to solve
        </p>
      )}
    </>
  )
}

function SolvedState({ puzzle, solve, dateLabel }: {
  puzzle: PublicPuzzle
  solve: Solve
  dateLabel: string
}) {
  return (
    <>
      <div className="flex items-center gap-2 mb-5">
        <span style={{ color: 'var(--color-success)', fontSize: 15 }}>✓</span>
        <span className="italic text-ink-muted" style={{ fontSize: 13 }}>
          Solved — {dateLabel}
        </span>
      </div>

      <div
        className="italic font-medium mb-3"
        style={{ fontSize: 28, color: 'var(--color-success)', letterSpacing: -0.4 }}
      >
        Nicely done.
      </div>

      <h2 className="font-medium mb-2" style={{ fontSize: 24, letterSpacing: -0.4 }}>
        {puzzle.title}
      </h2>

      <p className="italic text-ink-muted mb-6" style={{ fontSize: 15 }}>
        Solved in{' '}
        <strong style={{ color: 'var(--color-ink)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
          {formatElapsed(solve.elapsed_seconds)}
        </strong>
        {solve.hints_used > 0 && (
          <>, with{' '}
            <strong style={{ color: 'var(--color-ink)', fontWeight: 500 }}>
              {solve.hints_used}
            </strong>{' '}
            hint{solve.hints_used === 1 ? '' : 's'}
          </>
        )}.
      </p>

      <Link
        href={`/solution?id=${puzzle.id}&from=solved`}
        className="inline-flex items-center gap-2 font-medium no-underline transition-all duration-[180ms] hover:-translate-y-px group"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          borderRadius: 14,
          padding: '13px 22px',
          fontSize: 16,
          boxShadow: 'var(--shadow-btn)',
          fontFamily: 'inherit',
        }}
      >
        Read the worked solution
        <span className="transition-transform duration-[250ms] group-hover:translate-x-[3px]">→</span>
      </Link>
    </>
  )
}

function RevealedState({ puzzle, dateLabel }: {
  puzzle: PublicPuzzle
  dateLabel: string
}) {
  return (
    <>
      <div className="flex items-center gap-2 mb-5">
        <span
          style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-ink-muted)', display: 'inline-block', flexShrink: 0 }}
        />
        <span className="italic text-ink-muted" style={{ fontSize: 13 }}>
          Revealed — {dateLabel}
        </span>
      </div>

      <div
        className="italic font-medium mb-3 text-ink-muted"
        style={{ fontSize: 26, letterSpacing: -0.4 }}
      >
        See you tomorrow.
      </div>

      <h2 className="font-medium mb-6" style={{ fontSize: 24, letterSpacing: -0.4 }}>
        {puzzle.title}
      </h2>

      <Link
        href={`/solution?id=${puzzle.id}&from=revealed`}
        className="inline-flex items-center gap-2 font-medium no-underline transition-all duration-[180ms] hover:-translate-y-px group"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          borderRadius: 14,
          padding: '13px 22px',
          fontSize: 16,
          boxShadow: 'var(--shadow-btn)',
          fontFamily: 'inherit',
        }}
      >
        Read the worked solution
        <span className="transition-transform duration-[250ms] group-hover:translate-x-[3px]">→</span>
      </Link>
    </>
  )
}
