'use client'

import { useState, useRef } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const GENRES = ['Logic & Deduction', 'Quant & Interview', 'Pattern & Sequence', 'Lateral Riddle', 'Wordplay', 'Deduction']
const DIFFICULTY_LABELS = ['', 'Gentle', 'Medium', 'Hard', 'Spicy', 'Wicked']
const INPUT_STYLES = ['Free text', 'Numeric', 'Multiple choice']

const inputStyle: React.CSSProperties = {
  fontSize: 16, padding: '11px 14px',
  borderRadius: 12, border: '1px solid var(--color-hair-strong)',
  background: 'var(--color-paper)', color: 'var(--color-ink)',
  fontFamily: 'inherit', width: '100%', outline: 'none',
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical' as const,
  minHeight: 100,
  lineHeight: 1.6,
}

export default function SubmitForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [difficulty, setDifficulty] = useState(3)
  const formRef = useRef<HTMLFormElement>(null)
  const [submitterEmail, setSubmitterEmail] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')

    const fd = new FormData(e.currentTarget)
    const body = Object.fromEntries(fd.entries())

    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, difficulty }),
    })

    if (res.ok) {
      setStatus('success')
    } else {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        className="animate-reveal"
        style={{
          background: 'var(--color-paper)',
          borderRadius: 18,
          border: '1px solid var(--color-hair)',
          padding: '36px 40px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ fontSize: 28, color: 'var(--color-success)', marginBottom: 12 }}>✓</div>
        <h2 className="font-medium mb-3" style={{ fontSize: 28, letterSpacing: -0.5 }}>
          Thanks — I'll read it.
        </h2>
        <p className="italic text-ink-muted mb-8" style={{ fontSize: 15 }}>
          Confirmation sent to {submitterEmail}.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/"
            style={{
              padding: '11px 20px', borderRadius: 12,
              border: '1px solid var(--color-hair-strong)',
              background: 'transparent', color: 'var(--color-ink)',
              fontSize: 15, fontFamily: 'inherit', textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Back to the column
          </a>
          <button
            onClick={() => { setStatus('idle'); formRef.current?.reset(); setDifficulty(3) }}
            style={{
              padding: '11px 20px', borderRadius: 12,
              border: '1px solid var(--color-hair-strong)',
              background: 'transparent', color: 'var(--color-ink)',
              fontSize: 15, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            Submit another
          </button>
        </div>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      {/* The puzzle */}
      <Fieldset label="the puzzle">
        <FormField label="Title" required>
          <input name="title" type="text" maxLength={64} required style={inputStyle} placeholder="Give it a name" />
        </FormField>
        <FormField label="Prompt" required>
          <textarea name="prompt" required style={{ ...textareaStyle, minHeight: 120 }} placeholder="The full puzzle, as a solver would read it." />
        </FormField>
        <FormField label="Answer" required>
          <input name="answer" type="text" required style={inputStyle} placeholder="The exact answer, case-insensitive" />
        </FormField>
        <FormField label="Input style" required>
          <select name="input_style" required style={inputStyle}>
            {INPUT_STYLES.map(s => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Hint 1">
          <input name="hint_1" type="text" style={inputStyle} placeholder="Optional — a gentle nudge" />
        </FormField>
        <FormField label="Hint 2">
          <input name="hint_2" type="text" style={inputStyle} placeholder="Optional — narrows it further" />
        </FormField>
        <FormField label="Hint 3">
          <input name="hint_3" type="text" style={inputStyle} placeholder="Optional — near-giveaway" />
        </FormField>
        <FormField label="Solution walkthrough" required>
          <textarea
            name="solution_walkthrough"
            required
            style={{ ...textareaStyle, minHeight: 160 }}
            placeholder="Step-by-step canonical path. This becomes the worked solution."
          />
        </FormField>
      </Fieldset>

      {/* About the puzzle */}
      <Fieldset label="about the puzzle">
        <FormField label="Genre" required>
          <select name="genre" required style={inputStyle}>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
        </FormField>
        <FormField label="Difficulty">
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        </FormField>
        <FormField label="Source">
          <input name="source" type="text" style={inputStyle} placeholder="Optional — origin, attribution, or inspiration" />
        </FormField>
      </Fieldset>

      {/* You */}
      <Fieldset label="you">
        <FormField label="Name" required>
          <input name="submitter_name" type="text" required style={inputStyle} placeholder="Your name" />
        </FormField>
        <FormField label="Email" required>
          <input
            name="submitter_email"
            type="email"
            required
            style={inputStyle}
            placeholder="your@email.com"
            onChange={e => setSubmitterEmail(e.target.value)}
          />
        </FormField>
        <FormField label="Notes">
          <textarea name="notes" style={{ ...textareaStyle, minHeight: 80 }} placeholder="Anything else we should know?" />
        </FormField>
      </Fieldset>

      {status === 'error' && (
        <p className="italic" style={{ color: 'var(--color-accent)', fontSize: 14 }}>
          Something went wrong — please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          borderRadius: 14, padding: '13px 28px',
          fontSize: 17, fontFamily: 'inherit',
          border: 'none', cursor: status === 'submitting' ? 'default' : 'pointer',
          opacity: status === 'submitting' ? 0.6 : 1,
          boxShadow: 'var(--shadow-btn)',
          transition: 'all 0.18s var(--ease-puddle)',
        }}
      >
        {status === 'submitting' ? 'Sending…' : 'Submit puzzle →'}
      </button>
    </form>
  )
}

function Fieldset({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend
        className="italic font-medium mb-4"
        style={{
          fontSize: 14, color: 'var(--color-ink-muted)',
          borderBottom: '1px solid var(--color-hair)',
          paddingBottom: 6, width: '100%', marginBottom: 16,
          textTransform: 'capitalize',
        }}
      >
        {label}
      </legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ fontSize: 14, color: 'var(--color-ink)', fontStyle: 'italic' }}>
        {label}{required && <span style={{ color: 'var(--color-accent)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function DifficultyPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: n <= value ? 'var(--color-accent)' : 'var(--color-paper-deep)',
            border: `1px solid ${n <= value ? 'var(--color-accent)' : 'var(--color-hair-strong)'}`,
            cursor: 'pointer',
            transform: n === value ? 'scale(1.15)' : 'scale(1)',
            transition: 'all 0.15s var(--ease-puddle)',
          }}
          title={DIFFICULTY_LABELS[n]}
        />
      ))}
      <span className="italic text-ink-muted ml-2" style={{ fontSize: 14 }}>
        {DIFFICULTY_LABELS[value]}
      </span>
    </div>
  )
}
