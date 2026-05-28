'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Puzzle, Genre, InputType, SolutionStep } from '@/types'

interface PuzzleFormProps {
  initialData?: Puzzle
}

const GENRES: Genre[] = ['logic', 'quant', 'pattern', 'lateral', 'wordplay', 'deduction']
const GENRE_LABELS: Record<Genre, string> = {
  logic: 'Logic & Deduction',
  quant: 'Quant & Interview',
  pattern: 'Pattern & Sequence',
  lateral: 'Lateral Riddle',
  wordplay: 'Wordplay',
  deduction: 'Deduction',
}

export default function PuzzleForm({ initialData }: PuzzleFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [issueNo, setIssueNo] = useState(initialData?.issue_no?.toString() ?? '')
  const [vol, setVol] = useState(initialData?.vol?.toString() ?? '1')
  const [dateActive, setDateActive] = useState(initialData?.date_active ?? '')
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [genre, setGenre] = useState<Genre>(initialData?.genre ?? 'logic')
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? 3)
  const [prompt, setPrompt] = useState<string[]>(
    initialData?.prompt?.length ? initialData.prompt : [''],
  )
  const [answer, setAnswer] = useState(initialData?.answer ?? '')
  const [answerDisplay, setAnswerDisplay] = useState(initialData?.answer_display ?? '')
  const [hints, setHints] = useState<[string, string, string]>([
    initialData?.hints?.[0] ?? '',
    initialData?.hints?.[1] ?? '',
    initialData?.hints?.[2] ?? '',
  ])
  const [solutionLede, setSolutionLede] = useState(initialData?.solution_lede ?? '')
  const [solutionSteps, setSolutionSteps] = useState<SolutionStep[]>(
    (initialData?.solution_steps as SolutionStep[] | undefined)?.length
      ? (initialData!.solution_steps as SolutionStep[])
      : [{ body: '', elapsed_min: '' }],
  )
  const [inputType, setInputType] = useState<InputType>(initialData?.input_type ?? 'freetext')
  const [numericMin, setNumericMin] = useState(
    ((initialData?.input_config as any)?.min ?? 0).toString(),
  )
  const [numericMax, setNumericMax] = useState(
    ((initialData?.input_config as any)?.max ?? 100).toString(),
  )
  const [choiceOptions, setChoiceOptions] = useState<string[]>(
    (initialData?.input_config as any)?.options ?? ['', ''],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const inputConfig =
      inputType === 'numeric'
        ? { min: parseInt(numericMin), max: parseInt(numericMax) }
        : inputType === 'choice'
        ? { options: choiceOptions.filter(o => o.trim()) }
        : null

    const payload = {
      issue_no: parseInt(issueNo),
      vol: parseInt(vol),
      date_active: dateActive,
      title: title.trim(),
      genre,
      difficulty,
      prompt: prompt.filter(p => p.trim()),
      answer: answer.trim().toLowerCase(),
      answer_display: answerDisplay.trim(),
      hints: hints.map(h => h.trim()),
      solution_lede: solutionLede.trim(),
      solution_steps: solutionSteps.filter(s => s.body.trim()),
      input_type: inputType,
      input_config: inputConfig,
    }

    try {
      const url = isEdit ? `/api/admin/puzzles/${initialData!.id}` : '/api/admin/puzzles'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!initialData || !confirm('Delete this puzzle? This cannot be undone.')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/puzzles/${initialData.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ─── Metadata ─── */}
      <Section title="Metadata">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <Field label="Issue no.">
            <input
              type="number" required value={issueNo}
              onChange={e => setIssueNo(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Vol.">
            <input
              type="number" required value={vol}
              onChange={e => setVol(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Date active">
            <input
              type="date" required value={dateActive}
              onChange={e => setDateActive(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Difficulty (1–5)">
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n} type="button" onClick={() => setDifficulty(n)}
                  style={{
                    width: 34, height: 34, borderRadius: 8, fontFamily: 'inherit',
                    border: `1px solid ${difficulty === n ? 'var(--color-ink)' : 'var(--color-hair-strong)'}`,
                    background: difficulty === n ? 'var(--color-ink)' : 'var(--color-paper)',
                    color: difficulty === n ? 'var(--color-paper)' : 'var(--color-ink)',
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Genre">
            <select value={genre} onChange={e => setGenre(e.target.value as Genre)} style={inputStyle}>
              {GENRES.map(g => <option key={g} value={g}>{GENRE_LABELS[g]}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* ─── Prompt ─── */}
      <Section title="Prompt">
        <div className="flex flex-col gap-2">
          {prompt.map((para, i) => (
            <div key={i} className="flex gap-2 items-start">
              <textarea
                value={para} rows={3}
                onChange={e => setPrompt(p => p.map((v, j) => j === i ? e.target.value : v))}
                placeholder={`Paragraph ${i + 1}`}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              {prompt.length > 1 && (
                <button type="button" onClick={() => setPrompt(p => p.filter((_, j) => j !== i))} style={removeBtnStyle}>×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setPrompt(p => [...p, ''])} style={addBtnStyle}>
            + Add paragraph
          </button>
        </div>
      </Section>

      {/* ─── Answer ─── */}
      <Section title="Answer">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Answer for comparison (auto-lowercased)">
            <input
              type="text" required value={answer}
              onChange={e => setAnswer(e.target.value)}
              onBlur={e => setAnswer(e.target.value.trim().toLowerCase())}
              style={inputStyle}
            />
          </Field>
          <Field label="Answer display (original casing)">
            <input
              type="text" required value={answerDisplay}
              onChange={e => setAnswerDisplay(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>
      </Section>

      {/* ─── Input type ─── */}
      <Section title="Input type">
        <Field label="Type">
          <select
            value={inputType}
            onChange={e => setInputType(e.target.value as InputType)}
            style={{ ...inputStyle, maxWidth: 220 }}
          >
            <option value="freetext">Free text</option>
            <option value="numeric">Numeric</option>
            <option value="choice">Multiple choice</option>
          </select>
        </Field>

        {inputType === 'numeric' && (
          <div className="flex gap-4 mt-3">
            <Field label="Min">
              <input type="number" value={numericMin} onChange={e => setNumericMin(e.target.value)} style={{ ...inputStyle, maxWidth: 100 }} />
            </Field>
            <Field label="Max">
              <input type="number" value={numericMax} onChange={e => setNumericMax(e.target.value)} style={{ ...inputStyle, maxWidth: 100 }} />
            </Field>
          </div>
        )}

        {inputType === 'choice' && (
          <div className="flex flex-col gap-2 mt-3">
            {choiceOptions.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span style={{ fontSize: 13, color: 'var(--color-ink-muted)', minWidth: 20, fontStyle: 'italic' }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                <input
                  type="text" value={opt}
                  onChange={e => setChoiceOptions(o => o.map((v, j) => j === i ? e.target.value : v))}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  style={inputStyle}
                />
                {choiceOptions.length > 2 && (
                  <button type="button" onClick={() => setChoiceOptions(o => o.filter((_, j) => j !== i))} style={removeBtnStyle}>×</button>
                )}
              </div>
            ))}
            {choiceOptions.length < 6 && (
              <button type="button" onClick={() => setChoiceOptions(o => [...o, ''])} style={addBtnStyle}>
                + Add option
              </button>
            )}
          </div>
        )}
      </Section>

      {/* ─── Hints ─── */}
      <Section title="Hints">
        <div className="flex flex-col gap-3">
          {([0, 1, 2] as const).map(i => (
            <Field key={i} label={`Hint ${i + 1}`}>
              <textarea
                value={hints[i]} rows={2}
                onChange={e => setHints(h => {
                  const next: [string, string, string] = [...h] as [string, string, string]
                  next[i] = e.target.value
                  return next
                })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
          ))}
        </div>
      </Section>

      {/* ─── Solution ─── */}
      <Section title="Solution">
        <Field label="Lede">
          <textarea
            required value={solutionLede} rows={5}
            onChange={e => setSolutionLede(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>

        <div className="mt-5">
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 10, fontStyle: 'italic' }}>Steps</p>
          <div className="flex flex-col gap-3">
            {solutionSteps.map((step, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--color-paper)',
                  border: '1px solid var(--color-hair)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <div className="flex gap-3 items-start mb-2">
                  <span style={{ fontSize: 18, color: 'var(--color-accent)', fontWeight: 500, lineHeight: 1.4, flexShrink: 0 }}>
                    {i + 1}.
                  </span>
                  <textarea
                    value={step.body} rows={2}
                    onChange={e => setSolutionSteps(s => s.map((v, j) => j === i ? { ...v, body: e.target.value } : v))}
                    placeholder="Step description"
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="text" value={step.elapsed_min}
                    onChange={e => setSolutionSteps(s => s.map((v, j) => j === i ? { ...v, elapsed_min: e.target.value } : v))}
                    placeholder="Elapsed (e.g. 3 min)"
                    style={{ ...inputStyle, maxWidth: 160, fontSize: 13 }}
                  />
                  {solutionSteps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSolutionSteps(s => s.filter((_, j) => j !== i))}
                      style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--color-ink-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSolutionSteps(s => [...s, { body: '', elapsed_min: '' }])}
              style={addBtnStyle}
            >
              + Add step
            </button>
          </div>
        </div>
      </Section>

      {/* ─── Actions ─── */}
      {error && (
        <p style={{ color: 'var(--color-accent)', fontSize: 14, marginBottom: 16, fontStyle: 'italic' }}>
          {error}
        </p>
      )}
      <div className="flex items-center gap-4 flex-wrap pb-12">
        <button
          type="submit" disabled={saving}
          style={{
            background: 'var(--color-ink)',
            color: 'var(--color-paper)',
            borderRadius: 14,
            padding: '12px 26px',
            fontSize: 16,
            fontFamily: 'inherit',
            fontWeight: 500,
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.6 : 1,
            border: 'none',
            boxShadow: 'var(--shadow-btn)',
          }}
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create puzzle'}
        </button>
        <a
          href="/admin"
          style={{ fontSize: 15, color: 'var(--color-ink-muted)', fontStyle: 'italic', textDecoration: 'none' }}
        >
          Cancel
        </a>
        {isEdit && (
          <button
            type="button" disabled={saving} onClick={handleDelete}
            style={{
              marginLeft: 'auto',
              fontSize: 14,
              color: 'var(--color-accent)',
              fontStyle: 'italic',
              background: 'none',
              border: 'none',
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.4 : 1,
              fontFamily: 'inherit',
            }}
          >
            Delete puzzle
          </button>
        )}
      </div>
    </form>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: '1px solid var(--color-hair)', paddingTop: 22, marginBottom: 26 }}>
      <h2
        className="italic font-medium text-accent mb-4"
        style={{ fontSize: 15, letterSpacing: -0.1 }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, letterSpacing: '0.2px', color: 'var(--color-ink-muted)', marginBottom: 5, display: 'block', fontStyle: 'italic' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 13px',
  fontSize: 15,
  borderRadius: 10,
  border: '1px solid var(--color-hair-strong)',
  background: 'var(--color-paper)',
  color: 'var(--color-ink)',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

const removeBtnStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1px solid var(--color-hair-strong)',
  background: 'transparent',
  color: 'var(--color-ink-muted)',
  cursor: 'pointer',
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'inherit',
  lineHeight: 1,
}

const addBtnStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--color-accent)',
  fontStyle: 'italic',
  background: 'transparent',
  border: '1px dashed var(--color-hair-strong)',
  borderRadius: 8,
  padding: '7px 14px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
}
