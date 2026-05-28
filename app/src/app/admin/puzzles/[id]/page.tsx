export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'
import PuzzleForm from '../../PuzzleForm'
import { getPuzzleById } from '@/lib/db/puzzles'
import { createServiceClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Edit puzzle — admin' }

export default async function EditPuzzlePage({ params }: Props) {
  const { id } = await params
  const puzzle = await getPuzzleById(id)
  if (!puzzle) notFound()

  const db = createServiceClient()
  const [{ data: prev }, { data: next }] = await Promise.all([
    db.from('puzzles').select('id').lt('issue_no', puzzle.issue_no).order('issue_no', { ascending: false }).limit(1).maybeSingle(),
    db.from('puzzles').select('id').gt('issue_no', puzzle.issue_no).order('issue_no', { ascending: true }).limit(1).maybeSingle(),
  ])

  return (
    <>
      <Masthead />
      <main className="flex-1 max-w-[860px] mx-auto w-full px-4 py-8 sm:px-14">
        {/* Nav bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin"
            className="italic text-ink-muted hover:text-ink transition-colors duration-[180ms]"
            style={{ fontSize: 14 }}
          >
            ← Back to puzzles
          </Link>
          <div className="flex items-center gap-3">
            {prev ? (
              <Link
                href={`/admin/puzzles/${prev.id}`}
                className="italic text-ink-muted hover:text-ink transition-colors duration-[180ms]"
                style={{ fontSize: 14 }}
              >
                ← Prev
              </Link>
            ) : (
              <span className="italic text-ink-muted" style={{ fontSize: 14, opacity: 0.35 }}>← Prev</span>
            )}
            <span className="italic text-ink-muted" style={{ fontSize: 13 }}>No. {puzzle.issue_no}</span>
            {next ? (
              <Link
                href={`/admin/puzzles/${next.id}`}
                className="italic text-ink-muted hover:text-ink transition-colors duration-[180ms]"
                style={{ fontSize: 14 }}
              >
                Next →
              </Link>
            ) : (
              <span className="italic text-ink-muted" style={{ fontSize: 14, opacity: 0.35 }}>Next →</span>
            )}
          </div>
        </div>

        <p className="italic text-accent mb-1" style={{ fontSize: 13 }}>Admin</p>
        <h1 className="font-medium mb-8" style={{ fontSize: 36, letterSpacing: -0.7 }}>
          Edit — {puzzle.title}
        </h1>
        <PuzzleForm initialData={puzzle} />
      </main>
      <Footer />
    </>
  )
}
