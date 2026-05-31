import { notFound } from 'next/navigation'
import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'
import PuzzleCard from '@/components/puzzle/PuzzleCard'
import Countdown from '@/components/puzzle/Countdown'
import { getPuzzleForDate, stripAnswer, getPuzzleStats } from '@/lib/db/puzzles'
import { getSolveForUser } from '@/lib/db/solves'
import { getCurrentUser } from '@/lib/auth/current-user'
import { getTodayNY } from '@/lib/utils/dates'
import type { Solve } from '@/types'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const today = getTodayNY()
  const puzzle = await getPuzzleForDate(today)
  if (!puzzle) notFound()

  const publicPuzzle = stripAnswer(puzzle)
  const stats = await getPuzzleStats(puzzle.id)

  let solve: Solve | null = null
  const user = await getCurrentUser()
  if (user) solve = await getSolveForUser(user.id, puzzle.id)

  return (
    <>
      <Masthead issueNo={puzzle.issue_no} vol={puzzle.vol} />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 py-6 sm:px-14 sm:py-7 pb-6">
        <div className="flex flex-col md:grid w-full" style={{ gridTemplateColumns: '1.05fr 0.95fr', gap: '72px', alignItems: 'start' }}>
          {/* Left: editorial lede */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div style={{ width: 28, height: 1, background: 'var(--color-accent)' }} />
              <span className="italic text-accent" style={{ fontSize: 15 }}>
                A daily puzzle column
              </span>
            </div>

            <h1
              className="font-medium leading-[0.98] mb-6"
              style={{
                fontSize: 'clamp(48px, 6vw, 84px)',
                letterSpacing: '-1.4px',
                textWrap: 'balance',
              } as React.CSSProperties}
            >
              A puzzle,{' '}
              <em className="italic" style={{ color: 'var(--color-ink-soft)' }}>delivered</em>{' '}
              each{' '}
              <span className="italic" style={{ color: 'var(--color-accent)' }}>day.</span>
            </h1>

            <p className="leading-relaxed mb-8 max-w-[38ch]" style={{ fontSize: 19.5 }}>
              One puzzle daily — logic, sequences, lateral riddles, wordplay.{' '}
              <span className="italic" style={{ color: 'var(--color-ink-muted)' }}>
                No time pressure. No leaderboards.
              </span>
            </p>

            {/* Meta row */}
            <div
              className="flex items-center flex-wrap"
              style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums', gap: '0' }}
            >
              {stats.total_solved > 0 && (
                <>
                  <span>
                    <strong style={{ fontWeight: 500 }}>
                      {stats.total_solved.toLocaleString()}
                    </strong>{' '}
                    <span className="italic" style={{ color: 'var(--color-ink-muted)' }}>solved today</span>
                  </span>
                  <span className="mx-3" style={{ color: 'var(--color-hair-strong)' }}>·</span>
                </>
              )}
              <span>
                <Countdown />{' '}
                <span className="italic" style={{ color: 'var(--color-ink-muted)' }}>to next puzzle</span>
              </span>
            </div>
          </div>

          {/* Right: puzzle card */}
          <div>
            <PuzzleCard puzzle={publicPuzzle} solve={solve} stats={stats} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
