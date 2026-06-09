'use client'

import { useEffect, useState } from 'react'
import {
  activeAnnouncement,
  dismiss,
  getDismissed,
  type Announcement,
} from '@/lib/announcements'
import { getTodayNY } from '@/lib/utils/dates'

// A slim, dismissible "what's new" bar at the top of every page. Renders nothing
// on the server (dismissal state lives in localStorage), then shows the first
// active, undismissed announcement after mount — mirroring ThemeWatcher/A11y.
export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    setAnnouncement(activeAnnouncement(getTodayNY(), getDismissed()))
  }, [])

  if (!announcement) return null

  const onDismiss = () => {
    dismiss(announcement.id)
    setAnnouncement(null)
  }

  return (
    <div
      role="status"
      className="w-full"
      style={{
        background: 'var(--color-paper-deep)',
        borderBottom: '1px solid var(--color-hair)',
        color: 'var(--color-ink)',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-14 py-2 flex items-center gap-3">
        <p className="flex-1 text-center" style={{ fontSize: 14, lineHeight: 1.4, margin: 0 }}>
          {announcement.text}
          {announcement.cta && (
            <a
              href={announcement.cta.href}
              target={announcement.cta.external ? '_blank' : undefined}
              rel={announcement.cta.external ? 'noopener noreferrer' : undefined}
              className="ml-2 text-accent hover:underline"
              style={{ fontWeight: 500, whiteSpace: 'nowrap' }}
            >
              {announcement.cta.label} →
            </a>
          )}
        </p>
        <button
          onClick={onDismiss}
          aria-label="Dismiss announcement"
          className="text-ink-muted hover:text-ink transition-colors duration-[180ms]"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
            padding: '0 4px',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
