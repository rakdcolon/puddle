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
