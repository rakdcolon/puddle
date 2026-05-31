'use client'

import { useEffect } from 'react'
import { applyTheme, getStoredPref, THEME_KEY } from '@/lib/theme'

// Re-applies the theme when the OS scheme changes (while in "Automatic") and
// when the preference is changed in another tab. Initial application is handled
// before paint by the inline script in the root layout; this just keeps a
// long-lived session in sync. Renders nothing.
export default function ThemeWatcher() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onScheme = () => {
      if (getStoredPref() === 'auto') applyTheme('auto')
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) applyTheme(getStoredPref())
    }
    mq.addEventListener('change', onScheme)
    window.addEventListener('storage', onStorage)
    return () => {
      mq.removeEventListener('change', onScheme)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return null
}
