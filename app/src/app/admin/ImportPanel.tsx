'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ImportPanel() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [json, setJson] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleImport() {
    setStatus('loading')
    setMessage('')

    let puzzle
    try {
      puzzle = JSON.parse(json)
    } catch {
      setStatus('error')
      setMessage('Invalid JSON — check syntax and try again.')
      return
    }

    if (typeof puzzle.answer === 'string') {
      puzzle.answer = puzzle.answer.trim().toLowerCase()
    }

    try {
      const res = await fetch('/api/admin/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(puzzle),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      setStatus('ok')
      setMessage(`Imported: No. ${puzzle.issue_no} — "${puzzle.title}"`)
      setJson('')
      router.refresh()
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  return (
    <div style={{ borderTop: '1px solid var(--color-hair)', marginTop: 40, paddingTop: 24 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 14,
          fontStyle: 'italic',
          color: 'var(--color-ink-muted)',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 11, display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>▶</span>
        Import from JSON
      </button>

      {open && (
        <div className="mt-4">
          <p className="italic text-ink-muted mb-3" style={{ fontSize: 13 }}>
            Paste a puzzle JSON object. See <code style={{ fontSize: 12 }}>puzzles/template.json</code> for the expected shape.
          </p>
          <textarea
            value={json}
            onChange={e => { setJson(e.target.value); setStatus('idle'); setMessage('') }}
            placeholder='{ "issue_no": 4, "title": "...", ... }'
            rows={12}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 13,
              borderRadius: 10,
              border: '1px solid var(--color-hair-strong)',
              background: 'var(--color-paper)',
              color: 'var(--color-ink)',
              fontFamily: 'monospace',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={handleImport}
              disabled={!json.trim() || status === 'loading'}
              style={{
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                borderRadius: 12,
                padding: '9px 20px',
                fontSize: 14,
                fontFamily: 'inherit',
                fontWeight: 500,
                border: 'none',
                cursor: !json.trim() || status === 'loading' ? 'default' : 'pointer',
                opacity: !json.trim() || status === 'loading' ? 0.5 : 1,
                boxShadow: 'var(--shadow-btn)',
              }}
            >
              {status === 'loading' ? 'Importing…' : 'Import'}
            </button>
            {message && (
              <span
                className="italic"
                style={{ fontSize: 14, color: status === 'ok' ? 'var(--color-success)' : 'var(--color-accent)' }}
              >
                {status === 'ok' ? '✓ ' : ''}{message}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
