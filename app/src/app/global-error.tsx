'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <html>
      <body style={{ margin: 0, fontFamily: 'inherit', background: '#faf8f4', color: '#1a1410', display: 'flex', flexDirection: 'column', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
        <p style={{ fontSize: 13, fontStyle: 'italic', color: '#c0392b', letterSpacing: '0.15px', marginBottom: 16 }}>
          Something went wrong
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 500, letterSpacing: '-0.8px', lineHeight: 1.04, marginBottom: 20 }}>
          We hit a snag on our end.
        </h1>
        <p style={{ fontSize: 17, fontStyle: 'italic', color: '#7a6a5a', lineHeight: 1.65, marginBottom: 40, maxWidth: 440 }}>
          This one's on us. Reload the page or head back to the column.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{ padding: '12px 24px', borderRadius: 12, fontSize: 17, fontWeight: 500, background: '#1a1410', color: '#faf8f4', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{ padding: '12px 24px', borderRadius: 12, fontSize: 17, fontWeight: 500, background: 'transparent', color: '#1a1410', border: '1px solid #d4ccc4', textDecoration: 'none', fontFamily: 'inherit' }}
          >
            Back to the column
          </a>
        </div>
      </body>
    </html>
  )
}
