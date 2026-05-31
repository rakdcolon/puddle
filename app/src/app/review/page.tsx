import { notFound } from 'next/navigation'
import Link from 'next/link'
import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'
import PuzzleReview from '@/components/puzzle/PuzzleReview'
import { getPuzzleById, stripAnswer } from '@/lib/db/puzzles'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Review — puddle' }

interface ReviewPageProps {
  searchParams: Promise<{ id?: string }>
}

// Read-only view of a puzzle, for re-reading it after solving or giving up.
// Shows the prompt and (for multiple choice) the answer options, with no way
// to submit. The prompt is the same public content shown on /puzzle, so this
// page isn't gated — only a valid puzzle id is required.
export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const { id } = await searchParams
  if (!id) notFound()

  const puzzle = await getPuzzleById(id)
  if (!puzzle) notFound()

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

        <article className="max-w-[680px]">
          <p className="italic text-accent tracking-[0.1px] mb-4" style={{ fontSize: 13 }}>
            No. {puzzle.issue_no} · for reference
          </p>

          <PuzzleReview puzzle={stripAnswer(puzzle)} />

          {/* Worked-solution link — no ?from, so the solution page still gates
              on the viewer's own solve. */}
          <div className="mt-10" style={{ borderTop: '1px solid var(--color-hair)', paddingTop: 24 }}>
            <Link
              href={`/solution?id=${puzzle.id}`}
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
              Read the worked solution
              <span className="transition-transform duration-[250ms] group-hover:translate-x-[3px]">→</span>
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
