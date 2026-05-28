export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'
import CalendarHeatmap from '@/components/profile/CalendarHeatmap'
import GenreChart from '@/components/profile/GenreChart'
import { createClient } from '@/lib/supabase/server'
import { getUserBySupabaseId, getUserProfile } from '@/lib/db/users'
import { formatElapsed, formatDate } from '@/lib/utils/dates'

export const metadata = { title: 'Profile — puddle' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/sign-in?returnTo=/profile')

  const user = await getUserBySupabaseId(authUser)
  if (!user) redirect('/sign-in')

  const profile = await getUserProfile(user.id)
  const { stats, calendar, recent, by_genre } = profile

  const initials = user.display_name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      <Masthead currentPage="profile" />
      <main className="flex-1 max-w-[720px] mx-auto w-full px-6 py-10">
        {/* Identity strip */}
        <div className="flex items-start justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div
              className="flex items-center justify-center flex-shrink-0 font-medium italic"
              style={{
                width: 84, height: 84,
                borderRadius: '50%',
                background: 'var(--color-paper-deep)',
                border: '1px solid var(--color-hair-strong)',
                fontSize: 28,
                letterSpacing: -0.5,
                color: 'var(--color-ink-soft)',
              }}
            >
              {initials}
            </div>
            <div>
              <h1 className="font-medium mb-1" style={{ fontSize: 46, letterSpacing: -1, lineHeight: 1 }}>
                {user.display_name}
              </h1>
              <p className="italic text-ink-muted" style={{ fontSize: 14 }}>
                Solving since {formatDate(user.created_at.slice(0, 10))} ·{' '}
                {stats.total_attempted} puzzles attempted ·{' '}
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {stats.total_solved} solved
                </span>
              </p>
            </div>
          </div>

          {/* Level card */}
          <div
            className="flex-shrink-0 text-right"
            style={{ minWidth: 100 }}
          >
            <div className="font-medium" style={{ fontSize: 34, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
              Lvl {stats.level}
            </div>
            <div className="italic text-ink-muted" style={{ fontSize: 13 }}>
              {stats.xp_in_level} / {stats.xp_for_level} XP
            </div>
            <div
              className="mt-1"
              style={{
                width: 80, height: 4, background: 'var(--color-paper-deep)',
                borderRadius: 2, overflow: 'hidden', marginLeft: 'auto',
              }}
            >
              <div
                style={{
                  width: `${(stats.xp_in_level / stats.xp_for_level) * 100}%`,
                  height: '100%',
                  background: 'var(--color-accent)',
                  transition: 'width 0.8s var(--ease-puddle)',
                }}
              />
            </div>
          </div>
        </div>

        {/* By the numbers */}
        <section className="mb-10">
          <h2 className="italic font-medium mb-4 text-accent" style={{ fontSize: 18, letterSpacing: -0.2 }}>
            By the numbers
          </h2>
          <div
            style={{
              background: 'var(--color-paper)',
              borderRadius: 16,
              border: '1px solid var(--color-hair)',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
            }}
          >
            {[
              { label: 'level', value: String(stats.level), foot: `${stats.xp} XP total` },
              { label: 'streak', value: String(stats.current_streak), foot: 'days in a row' },
              { label: 'win rate', value: `${stats.win_pct}%`, foot: `${stats.total_solved} solved` },
              {
                label: 'avg time',
                value: stats.avg_time_seconds ? formatElapsed(stats.avg_time_seconds) : '—',
                foot: 'per solve',
              },
              { label: 'attempted', value: String(stats.total_attempted), foot: 'all time' },
            ].map((tile, i) => (
              <div
                key={tile.label}
                className="text-center py-5 px-3"
                style={{
                  borderLeft: i > 0 ? '1px solid var(--color-hair)' : 'none',
                }}
              >
                <div className="italic text-ink-muted mb-1" style={{ fontSize: 13 }}>{tile.label}</div>
                <div
                  className="font-medium"
                  style={{ fontSize: 34, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
                >
                  {tile.value}
                </div>
                <div className="italic text-ink-muted mt-1" style={{ fontSize: 12 }}>{tile.foot}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Calendar heatmap */}
        <section className="mb-10">
          <h2 className="italic font-medium mb-4 text-accent" style={{ fontSize: 18, letterSpacing: -0.2 }}>
            Solving calendar
          </h2>
          <CalendarHeatmap entries={calendar} />
        </section>

        {/* Lower two-column grid */}
        <div className="grid gap-8" style={{ gridTemplateColumns: '1.15fr 1fr' }}>
          {/* Recent solves */}
          <section>
            <h2 className="italic font-medium mb-4 text-accent" style={{ fontSize: 18, letterSpacing: -0.2 }}>
              Recent
            </h2>
            <table className="w-full" style={{ fontSize: 14, borderCollapse: 'collapse' }}>
              <tbody>
                {recent.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-hair)' }}>
                    <td className="py-2 pr-3 italic text-ink-muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                      {s.date ? formatDate(s.date) : '—'}
                    </td>
                    <td className="py-2 pr-3 flex-1 text-ink" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </td>
                    <td className="py-2 pr-2 text-right italic text-ink-muted" style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {s.status === 'solved' ? formatElapsed(s.elapsed_seconds) : <span className="text-ink-muted">revealed</span>}
                    </td>
                    <td className="py-2 pl-1">
                      {s.hints_used === 0 && s.status === 'solved' && (
                        <span
                          className="italic"
                          style={{ fontSize: 11, color: 'var(--color-success)', border: '1px solid var(--color-success)', borderRadius: 6, padding: '1px 5px' }}
                        >
                          solo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 italic text-ink-muted text-center" style={{ fontSize: 14 }}>
                      No solves yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Genre breakdown */}
          <section>
            <h2 className="italic font-medium mb-4 text-accent" style={{ fontSize: 18, letterSpacing: -0.2 }}>
              By genre
            </h2>
            <GenreChart data={by_genre} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
