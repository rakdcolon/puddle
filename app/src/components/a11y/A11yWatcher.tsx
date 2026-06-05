'use client'

import { useEffect } from 'react'
import { applyA11y, getA11y, A11Y_SETTINGS } from '@/lib/a11y'

// Keeps a long-lived session's accessibility classes in sync when a preference is
// changed in another tab. Initial application happens before paint via the inline
// script in the root layout; this only handles cross-tab updates. Renders nothing.
export default function A11yWatcher() {
  useEffect(() => {
    const keys = new Set(Object.values(A11Y_SETTINGS).map(s => s.storageKey))
    const onStorage = (e: StorageEvent) => {
      if (e.key && keys.has(e.key)) applyA11y(getA11y())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return null
}
