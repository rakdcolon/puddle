import { notFound } from 'next/navigation'
import Link from 'next/link'
import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'
import Countdown from '@/components/puzzle/Countdown'
import { getPuzzleById } from '@/lib/db/puzzles'
import { getSolveForUser } from '@/lib/db/solves'
import { getCurrentUser } from '@/lib/auth/current-user'
import { getTodayNY } from '@/lib/utils/dates'
import type { SolutionStep } from '@/types'

export const dynamic = 'force-dynamic'

interface SolutionPageProps {
  searchParams: Promise<{ id?: string; from?: string; hints?: string }>
}

export default async function SolutionPage({ searchParams }: SolutionPageProps) {
  const { id, from, hints } = await searchParams
  if (!id) notFound()

  const puzzle = await getPuzzleById(id)
  if (!puzzle) notFound()

  // Gate check: must have solved/revealed, OR puzzle is from a previous day
  const today = getTodayNY()
  const isPast = puzzle.date_active < today
  let unlocked = isPast || !!from  // anonymous: honor ?from param as trust signal

  if (!unlocked) {
    const user = await getCurrentUser()
    if (user) {
      const solve = await getSolveForUser(user.id, puzzle.id)
      if (solve) unlocked = true
    }
  }

  if (!unlocked) {
    return (
      <>
        <Masthead />
        <main className="flex-1 flex flex-col items-center justify-center px-5 text-center py-20">
          <p className="italic text-ink-muted text-[17px] mb-6">
            Solve today's puzzle first to unlock the worked solution.
          </p>
          <Link
            href="/puzzle"
            className="inline-flex items-center gap-2 font-medium no-underline"
            style={{
              background: 'var(--color-ink)',
              color: 'var(--color-paper)',
              borderRadius: 14,
              padding: '12px 22px',
              fontSize: 16,
              fontFamily: 'inherit',
              boxShadow: 'var(--shadow-btn)',
            }}
          >
            Back to the puzzle →
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  const isSolved = from === 'solved'
  const isRevealed = from === 'revealed'

  return (
    <>
      <Masthead issueNo={puzzle.issue_no} vol={puzzle.vol} />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 py-6 sm:px-14 sm:py-8">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/"
            className="italic text-ink-muted hover:text-ink transition-colors duration-[180ms]"
            style={{ fontSize: 14 }}
          >
            ← back to the column
          </Link>
        </div>

        <article className="max-w-[640px]">
          <p className="italic text-accent tracking-[0.1px] mb-2" style={{ fontSize: 13 }}>
            Worked solution
          </p>
          <p className="italic text-ink-muted mb-3" style={{ fontSize: 14 }}>
            No. {puzzle.issue_no} · {puzzle.genre}
          </p>
          <h1
            className="font-medium leading-[1.04] mb-3"
            style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', letterSpacing: '-1px' }}
          >
            {puzzle.title}
          </h1>

          {/* Outcome banner */}
          {(isSolved || isRevealed) && (
            <div
              className="mb-8 px-5 py-4 rounded-card"
              style={{
                background: isSolved ? 'rgba(107,138,82,0.1)' : 'var(--color-paper-deep)',
                border: `1px solid ${isSolved ? 'var(--color-success)' : 'var(--color-hair-strong)'}`,
              }}
            >
              <div className="flex items-start gap-3">
                <span style={{ color: isSolved ? 'var(--color-success)' : 'var(--color-ink-muted)', fontSize: 16, marginTop: 1 }}>
                  {isSolved ? '✓' : '·'}
                </span>
                <div>
                  <p className="font-medium" style={{ fontSize: 17, color: isSolved ? 'var(--color-success)' : 'var(--color-ink)', marginBottom: 3 }}>
                    {isSolved ? 'Nicely done.' : `The answer was ${puzzle.answer_display}.`}
                  </p>
                  <p className="italic text-ink-muted" style={{ fontSize: 14 }}>
                    {isSolved
                      ? `You solved it${hints && hints !== '0' ? ` with ${hints} hint${hints === '1' ? '' : 's'}` : ''}. Here's the canonical path.`
                      : "Here's why."
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Solution lede */}
          <div
            className="mb-8 leading-[1.65]"
            style={{ fontSize: 18.5, borderTop: '1px solid var(--color-hair)', paddingTop: 28 }}
          >
            {puzzle.solution_lede.split('\n\n').map((para: string, i: number) => (
              <p key={i} className="mb-4">{para}</p>
            ))}
          </div>

          {/* The path */}
          <div className="mb-8">
            <h2
              className="italic font-medium mb-5"
              style={{ fontSize: 18, color: 'var(--color-accent)', letterSpacing: -0.2 }}
            >
              The path
            </h2>

            <div className="flex flex-col gap-4">
              {(puzzle.solution_steps as SolutionStep[]).map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-5 pb-4"
                  style={{ borderBottom: i < puzzle.solution_steps.length - 1 ? '1px dashed var(--color-hair-strong)' : 'none' }}
                >
                  <span
                    className="italic font-medium flex-shrink-0"
                    style={{ fontSize: 28, color: 'var(--color-accent)', lineHeight: 1.1, minWidth: 28 }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p style={{ fontSize: 17, lineHeight: 1.6 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* End CTA */}
          <div style={{ borderTop: '1px solid var(--color-hair)', paddingTop: 28 }}>
            <p className="italic text-ink-muted mb-5" style={{ fontSize: 14 }}>
              Tomorrow's puzzle drops at midnight · <Countdown /> from now.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-medium no-underline transition-all duration-[180ms] hover:-translate-y-px group"
              style={{
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                borderRadius: 14,
                padding: '13px 22px',
                fontSize: 16,
                fontFamily: 'inherit',
                boxShadow: 'var(--shadow-btn)',
              }}
            >
              Back to the column
              <span className="transition-transform duration-[250ms] group-hover:translate-x-[3px]">→</span>
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
