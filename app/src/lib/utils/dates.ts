// Returns today's date in New York timezone as 'YYYY-MM-DD'
export function getTodayNY(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
  }).format(new Date())
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function formatElapsed(seconds: number | null): string {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// The New York civil date `n` days before today (n = 0 is today), as
// 'YYYY-MM-DD'. Anchors on the NY date, then steps back whole calendar days, so
// it stays correct across DST and aligns with the puzzle's day boundary
// (date_active). Use this instead of UTC `new Date()` arithmetic, which drifts a
// day ahead between ~7pm ET and ET midnight.
export function nyDateDaysAgo(n: number): string {
  const [y, m, d] = getTodayNY().split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) - n * 86_400_000).toISOString().slice(0, 10)
}

// Length of the run of consecutive solved days ending today (includeToday) or
// yesterday (!includeToday). `solvedDates` holds 'YYYY-MM-DD' date_active
// values. When includeToday is true and today is not yet solved, the run is
// measured from yesterday rather than broken (so an unsolved today does not zero
// the streak before the day is over). Looks back up to 365 days, so the maximum
// reported streak is 365 (or 366 when includeToday is true).
export function streakLength(solvedDates: Set<string>, includeToday: boolean): number {
  let streak = 0
  for (let i = includeToday ? 0 : 1; i <= 365; i++) {
    if (solvedDates.has(nyDateDaysAgo(i))) {
      streak++
    } else if (includeToday && i === 0) {
      continue // today not solved yet — measure from yesterday, don't break
    } else {
      break
    }
  }
  return streak
}

// Seconds until midnight ET
export function secondsUntilMidnightNY(): number {
  const now = new Date()
  const nyNow = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now)

  const h = Number(nyNow.find(p => p.type === 'hour')?.value ?? 0)
  const m = Number(nyNow.find(p => p.type === 'minute')?.value ?? 0)
  const s = Number(nyNow.find(p => p.type === 'second')?.value ?? 0)

  return 86400 - (h * 3600 + m * 60 + s)
}
