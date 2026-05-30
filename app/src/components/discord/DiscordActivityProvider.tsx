'use client'

import { useEffect, useState } from 'react'
import {
  isInDiscordActivity,
  patchSupabaseForActivity,
  authenticateDiscordActivity,
  setPuddlePresence,
} from '@/lib/discord/sdk'

type Phase = 'pending' | 'ready' | 'error'

// Wraps the app so that, when loaded inside Discord, it patches networking and
// runs the Activity auth handshake before revealing the UI. Outside Discord it
// renders children unchanged. The in-activity switch happens post-mount so SSR
// and first client render match (no hydration mismatch).
export default function DiscordActivityProvider({ children }: { children: React.ReactNode }) {
  const [inActivity, setInActivity] = useState(false)
  const [phase, setPhase] = useState<Phase>('pending')

  useEffect(() => {
    const active = isInDiscordActivity()
    setInActivity(active)
    if (!active) {
      setPhase('ready')
      return
    }
    patchSupabaseForActivity()
    authenticateDiscordActivity()
      .then(() => {
        setPhase('ready')
        // Show rich presence on the user's profile (best-effort).
        setPuddlePresence()
      })
      .catch((err) => {
        console.error('Discord activity auth failed', err)
        setPhase('error')
      })
  }, [])

  if (inActivity && phase !== 'ready') {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-[15px] italic text-ink-muted">
          {phase === 'error' ? "Couldn't connect to Discord." : 'Connecting to Discord…'}
        </p>
      </main>
    )
  }

  return <>{children}</>
}
