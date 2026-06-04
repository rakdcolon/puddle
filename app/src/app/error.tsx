'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-5 text-center py-16 relative overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute select-none font-medium italic leading-none pointer-events-none"
        style={{
          fontSize: 'clamp(180px, 30vw, 340px)',
          color: 'var(--color-paper-deep)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
          letterSpacing: '-4px',
        }}
      >
        ??
      </span>

      <div className="relative z-10 max-w-[480px]">
        <p className="text-[13px] italic text-accent tracking-[0.15px] mb-4">
          Something went wrong
        </p>
        <h1 className="text-[42px] font-medium leading-[1.04] tracking-[-0.8px] mb-5">
          We hit a snag on our end.
        </h1>
        <p className="text-[17px] italic text-ink-muted leading-[1.65] mb-10">
          This one's on us, not your answer. Try again or head back to the column.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-btn text-[17px] font-medium text-paper transition-all duration-[180ms] hover:-translate-y-px"
            style={{ background: 'var(--color-ink)', boxShadow: 'var(--shadow-btn)', border: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-btn text-[17px] font-medium text-ink border border-hair-strong transition-all duration-[180ms] hover:-translate-y-px"
            style={{ background: 'var(--color-paper)' }}
          >
            Back to the column
          </Link>
        </div>
      </div>
    </main>
  )
}
