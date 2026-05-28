import Link from 'next/link'
import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'
import { createServiceClient } from '@/lib/supabase/server'
import { getTodayNY } from '@/lib/utils/dates'

export const metadata = { title: 'Puzzles — admin' }

export default async function AdminPage() {
  const db = createServiceClient()
  const { data: puzzles } = await db
    .from('puzzles')
    .select('id, issue_no, vol, date_active, title, genre, difficulty')
    .order('date_active', { ascending: false })

  const today = getTodayNY()

  return (
    <>
      <Masthead />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 py-8 sm:px-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="italic text-accent mb-1" style={{ fontSize: 13 }}>Admin</p>
            <h1 className="font-medium" style={{ fontSize: 36, letterSpacing: -0.7 }}>
              Puzzles
            </h1>
          </div>
          <Link
            href="/admin/puzzles/new"
            style={{
              background: 'var(--color-ink)',
              color: 'var(--color-paper)',
              borderRadius: 14,
              padding: '10px 20px',
              fontSize: 15,
              fontWeight: 500,
              textDecoration: 'none',
              boxShadow: 'var(--shadow-btn)',
              fontFamily: 'inherit',
            }}
          >
            + New puzzle
          </Link>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-hair-strong)' }}>
              {['No.', 'Date', 'Title', 'Genre', 'Status', ''].map(h => (
                <th key={h} className="text-left py-2 pr-5 italic text-ink-muted font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(puzzles ?? []).map(puzzle => {
              const status = puzzle.date_active < today ? 'past'
                : puzzle.date_active === today ? 'live'
                : 'upcoming'
              return (
                <tr key={puzzle.id} style={{ borderBottom: '1px solid var(--color-hair)' }}>
                  <td className="py-3 pr-5 text-ink-muted">{puzzle.issue_no}</td>
                  <td className="py-3 pr-5" style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {puzzle.date_active}
                  </td>
                  <td className="py-3 pr-5">{puzzle.title}</td>
                  <td className="py-3 pr-5 italic text-ink-muted">{puzzle.genre}</td>
                  <td className="py-3 pr-5">
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: `1px solid ${status === 'live' ? 'var(--color-success)' : status === 'upcoming' ? 'var(--color-accent)' : 'var(--color-hair-strong)'}`,
                      color: status === 'live' ? 'var(--color-success)' : status === 'upcoming' ? 'var(--color-accent)' : 'var(--color-ink-muted)',
                    }}>
                      {status}
                    </span>
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/admin/puzzles/${puzzle.id}`}
                      className="italic text-accent hover:opacity-70 transition-opacity"
                      style={{ fontSize: 14, textDecoration: 'none' }}
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(!puzzles || puzzles.length === 0) && (
              <tr>
                <td colSpan={6} className="py-8 text-center italic text-ink-muted">No puzzles yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
      <Footer />
    </>
  )
}
