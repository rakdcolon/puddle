'use client'

import { useState, useEffect } from 'react'
import { secondsUntilMidnightNY } from '@/lib/utils/dates'

export default function Countdown() {
  const [seconds, setSeconds] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setSeconds(secondsUntilMidnightNY())
    tick()

    // Tick every second in the last minute, every 30s otherwise
    const id = setInterval(() => {
      const s = secondsUntilMidnightNY()
      setSeconds(s)
    }, seconds != null && seconds < 60 ? 1000 : 30_000)

    return () => clearInterval(id)
  }, [])

  if (seconds == null) return <strong style={{ fontWeight: 500 }}>—</strong>

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  let label: string
  if (seconds >= 3600) label = `${h}h ${m}m`
  else if (seconds >= 60) label = `${m}m ${String(s).padStart(2, '0')}s`
  else label = `${s}s`

  return <strong style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{label}</strong>
}
