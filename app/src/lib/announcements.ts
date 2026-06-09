// In-page announcements ("what's new"). A small, hand-edited list: the banner
// shows the first entry that is in its date window and hasn't been dismissed on
// this device. Dismissal is per-device (localStorage), like theme/a11y prefs.
//
// To add one: prepend an entry with a NEW stable `id` (the dismissal key). Keep
// `text` em-dash-free and short. Optional `from`/`until` are 'YYYY-MM-DD' (NY).

export interface Announcement {
  id: string
  text: string
  cta?: { label: string; href: string; external?: boolean }
  from?: string // show on/after this date (inclusive)
  until?: string // hide on/after this date (exclusive)
}

// Newest first.
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'volume-2-the-mire',
    text: 'Volume II has arrived: The Mire. Fourteen new puzzles, one swamp.',
    cta: { label: 'Join the Discord', href: 'https://discord.gg/nH3dKXnN4u', external: true },
    until: '2026-06-24',
  },
]

const STORAGE_KEY = 'puddle.dismissed-announcements'

export function getDismissed(): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function dismiss(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set([...getDismissed(), id])]))
  } catch {
    // private mode / storage disabled — nothing to persist
  }
}

// The first announcement that is in its date window (today is the NY date) and
// not dismissed on this device. Returns null when there is nothing to show.
export function activeAnnouncement(today: string, dismissed: string[]): Announcement | null {
  for (const a of ANNOUNCEMENTS) {
    if (a.from && today < a.from) continue
    if (a.until && today >= a.until) continue
    if (dismissed.includes(a.id)) continue
    return a
  }
  return null
}
