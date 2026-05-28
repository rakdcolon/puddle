import type { CalendarEntry } from '@/types'

const STATE_COLORS: Record<string, string> = {
  solved: 'var(--color-accent)',
  'solved-with-hint': 'rgba(184,90,62,0.55)',
  'gave-up': 'rgba(165,149,129,0.5)',
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Build a week-aligned grid for a single month's entries.
// Returns columns of 7 rows (Mon–Sun); null cells are leading/trailing padding.
function buildMonthGrid(entries: CalendarEntry[]): (CalendarEntry | null)[][] {
  if (entries.length === 0) return []

  const firstDate = new Date(entries[0].date + 'T12:00:00Z')
  const firstOfMonth = new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), 1))
  // Mon=0 … Sun=6
  const leadingPad = (firstOfMonth.getUTCDay() + 6) % 7

  const flat: (CalendarEntry | null)[] = [
    ...Array(leadingPad).fill(null),
    ...entries,
  ]
  // Pad to a multiple of 7
  while (flat.length % 7 !== 0) flat.push(null)

  // Transpose: flat[0..6] = week-col 0, then slice into columns of 7 rows
  const cols: (CalendarEntry | null)[][] = []
  for (let i = 0; i < flat.length; i += 7) {
    cols.push(flat.slice(i, i + 7))
  }
  return cols
}

export default function CalendarHeatmap({ entries }: { entries: CalendarEntry[] }) {
  // Group by YYYY-MM
  const byMonth = new Map<string, CalendarEntry[]>()
  for (const entry of entries) {
    const key = entry.date.slice(0, 7)
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key)!.push(entry)
  }

  // Last 6 months only
  const monthKeys = Array.from(byMonth.keys()).sort().slice(-6)
  const months = monthKeys.map(key => ({
    key,
    label: MONTH_NAMES[parseInt(key.slice(5, 7), 10) - 1],
    grid: buildMonthGrid(byMonth.get(key)!),
  }))

  const CELL = 13
  const CELL_GAP = 3

  return (
    <div
      style={{
        background: 'var(--color-paper)',
        borderRadius: 16,
        border: '1px solid var(--color-hair)',
        padding: '16px 20px',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Day-of-week labels */}
        <div className="flex flex-col flex-shrink-0" style={{ gap: CELL_GAP, paddingTop: 1 }}>
          {['Mon', '', 'Wed', '', 'Fri', '', ''].map((label, i) => (
            <div
              key={i}
              className="italic text-ink-muted"
              style={{ width: 22, height: CELL, fontSize: 9, lineHeight: `${CELL}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Month groups */}
        <div className="flex" style={{ gap: 10 }}>
          {months.map(({ key, label, grid }) => (
            <div key={key} className="flex flex-col items-center">
              {/* Week columns */}
              <div className="flex" style={{ gap: CELL_GAP }}>
                {grid.map((col, ci) => (
                  <div key={ci} className="flex flex-col" style={{ gap: CELL_GAP }}>
                    {col.map((entry, ri) => (
                      <div
                        key={ri}
                        title={entry ? `${entry.date}${entry.state ? ` · ${entry.state.replace(/-/g, ' ')}` : ''}` : undefined}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 3,
                          flexShrink: 0,
                          background: entry?.state
                            ? STATE_COLORS[entry.state] ?? 'var(--color-paper-deep)'
                            : 'var(--color-paper-deep)',
                          opacity: entry === null ? 0 : 1,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Month label */}
              <div
                className="italic text-ink-muted"
                style={{ fontSize: 11, marginTop: 6, letterSpacing: '0.1px' }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {Object.entries(STATE_COLORS).map(([state, color]) => (
          <div key={state} className="flex items-center gap-1">
            <div style={{ width: 9, height: 9, borderRadius: 2, background: color }} />
            <span className="italic text-ink-muted capitalize" style={{ fontSize: 11 }}>
              {state.replace(/-/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
