import type { CalendarEntry } from '@/types'

const STATE_COLORS: Record<string, string> = {
  solved: 'var(--color-accent)',
  'solved-with-hint': 'rgba(184,90,62,0.55)',
  'gave-up': 'rgba(165,149,129,0.5)',
}

export default function CalendarHeatmap({ entries }: { entries: CalendarEntry[] }) {
  // Group into weeks (7 days per column)
  const weeks: CalendarEntry[][] = []
  for (let i = 0; i < entries.length; i += 7) {
    weeks.push(entries.slice(i, i + 7))
  }

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', '']

  return (
    <div
      style={{
        background: 'var(--color-paper)',
        borderRadius: 16,
        border: '1px solid var(--color-hair)',
        padding: '16px 20px',
        overflowX: 'auto',
      }}
    >
      <div className="flex gap-[3px]" style={{ minWidth: 'fit-content' }}>
        {/* Day labels column */}
        <div className="flex flex-col gap-[3px] mr-1" style={{ paddingTop: 20 }}>
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="italic text-ink-muted"
              style={{ width: 28, height: 14, fontSize: 10, lineHeight: '14px' }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {/* Month label — show on first week of each month */}
            <div
              className="italic text-ink-muted"
              style={{ fontSize: 10, height: 16, lineHeight: '16px', whiteSpace: 'nowrap' }}
            >
              {wi === 0 || (week[0] && new Date(week[0].date).getDate() <= 7)
                ? new Date(week[0]?.date ?? '').toLocaleString('en-US', { month: 'short' })
                : ''
              }
            </div>
            {week.map((entry, di) => (
              <div
                key={di}
                title={entry.date + (entry.state ? ` (${entry.state})` : '')}
                style={{
                  width: 14, height: 14,
                  borderRadius: 4,
                  background: entry.state
                    ? STATE_COLORS[entry.state] ?? 'var(--color-paper-deep)'
                    : 'var(--color-paper-deep)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {Object.entries(STATE_COLORS).map(([state, color]) => (
          <div key={state} className="flex items-center gap-1">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            <span className="italic text-ink-muted capitalize" style={{ fontSize: 11 }}>
              {state.replace('-', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
