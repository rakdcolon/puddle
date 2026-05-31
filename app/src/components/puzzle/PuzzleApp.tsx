'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { PublicPuzzle, Solve } from '@/types'
import { getTodayNY } from '@/lib/utils/dates'
import { calcXP, totalXpToLevel } from '@/lib/utils/xp'
import { setPuddlePresence } from '@/lib/discord/sdk'

// ─── Chime ───────────────────────────────────────────────────────────────────
const audioCtx: { ctx: AudioContext | null } = { ctx: null }

type ChimeKind = 'correct' | 'wrong' | 'hint' | 'select' | 'step' | 'give-up' | 'notes'

// [freq, delayOffset, peakGain, duration]
type NoteSpec = [number, number, number, number]

const CHIME_SPECS: Record<ChimeKind, NoteSpec[]> = {
  correct:  [[659.25, 0, 0.12, 0.35], [987.77, 0.12, 0.12, 0.35]],
  wrong:    [[220, 0, 0.10, 0.35], [174.61, 0.10, 0.10, 0.35]],
  hint:     [[523.25, 0, 0.08, 0.28], [659.25, 0.1, 0.06, 0.22]],
  select:   [[440, 0, 0.07, 0.10]],
  step:     [[880, 0, 0.045, 0.07]],
  'give-up':[[330, 0, 0.08, 0.32], [247, 0.18, 0.07, 0.32]],
  notes:    [[523.25, 0, 0.06, 0.18], [659.25, 0.09, 0.05, 0.15]],
}

function chime(kind: ChimeKind = 'correct') {
  try {
    if (!audioCtx.ctx) audioCtx.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const ctx = audioCtx.ctx
    if (ctx.state === 'suspended') ctx.resume()
    for (const [freq, delay, peak, dur] of CHIME_SPECS[kind]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t0 = ctx.currentTime + delay
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(peak, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + dur + 0.05)
    }
  } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function recordDaily(data: Record<string, unknown>) {
  try {
    localStorage.setItem('puddle.daily', JSON.stringify({ date: getTodayNY(), ...data }))
  } catch {}
}

// Stable per-browser id so anonymous solves are counted once per puzzle.
// Sent with submissions; signed-in users are tracked by account instead.
function getClientId(): string {
  try {
    let id = localStorage.getItem('puddle.cid')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('puddle.cid', id)
    }
    return id
  } catch {
    return ''
  }
}

function useTimer(running: boolean) {
  const [t, setT] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (!running) return
    startRef.current = Date.now()
    setT(0)
  }, [running])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setT(Math.floor((Date.now() - startRef.current) / 1000))
    }, 500)
    return () => clearInterval(id)
  }, [running])

  return t
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = 'idle' | 'correct' | 'wrong' | 'revealed'

interface PuzzleAppProps {
  puzzle: PublicPuzzle
  initialSolve?: Solve | null
  issueNo?: number
  vol?: number
  compact?: boolean
  streakBeforeToday?: number
  xpBeforeToday?: { totalXp: number; level: number }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PuzzleApp({ puzzle, initialSolve, issueNo = 1, vol = 1, compact = false, streakBeforeToday, xpBeforeToday }: PuzzleAppProps) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<Status>(() => {
    if (initialSolve?.status === 'solved') return 'correct'
    if (initialSolve?.status === 'revealed') return 'revealed'
    return 'idle'
  })
  const [attempts, setAttempts] = useState(0)
  const [hintLevel, setHintLevel] = useState(initialSolve?.hints_used ?? 0)
  const [shaking, setShaking] = useState(false)
  const [burst, setBurst] = useState(0)
  const [showScratch, setShowScratch] = useState(false)
  const [scratch, setScratch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [earnedXp, setEarnedXp] = useState<number | null>(null)

  const isFinished = status === 'correct' || status === 'revealed'
  const elapsed = useTimer(!isFinished && status !== 'wrong')

  const submit = useCallback(async () => {
    if (!answer.toString().trim() || isFinished || submitting) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/puzzle/${puzzle.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer,
          elapsed_seconds: elapsed,
          hints_used: hintLevel,
          attempts: attempts + 1,
          client_id: getClientId(),
        }),
      })
      const data = await res.json()

      if (data.correct) {
        setEarnedXp(calcXP(hintLevel, attempts + 1))
        setStatus('correct')
        setBurst(b => b + 1)
        chime('correct')
        recordDaily({
          state: 'solved',
          hints: hintLevel,
          attempts: attempts + 1,
          title: puzzle.title,
          issueNo,
          puzzleId: puzzle.id,
        })
        // Update Discord rich presence (no-op outside the Activity).
        const newStreak = (streakBeforeToday ?? 0) + 1
        setPuddlePresence({
          details: "Solved today's puzzle",
          state: newStreak >= 2 ? `🔥 ${newStreak}-day streak` : 'Daily brain teaser',
        })
      } else {
        setStatus('wrong')
        setAttempts(a => a + 1)
        setShaking(true)
        chime('wrong')
        setTimeout(() => setShaking(false), 440)
        setTimeout(() => setStatus(s => s === 'wrong' ? 'idle' : s), 1200)
      }
    } catch {
      // Network error — show wrong state
      setStatus('wrong')
      setShaking(true)
      setTimeout(() => setShaking(false), 440)
      setTimeout(() => setStatus(s => s === 'wrong' ? 'idle' : s), 1200)
    } finally {
      setSubmitting(false)
    }
  }, [answer, isFinished, submitting, puzzle.id, elapsed, hintLevel, attempts, issueNo, puzzle.title, streakBeforeToday])

  const revealHint = useCallback(async () => {
    if (hintLevel >= puzzle.hints.length || isFinished) return
    const next = hintLevel + 1
    setHintLevel(next)
    chime('hint')
    // Track server-side for authenticated users (fire-and-forget)
    fetch(`/api/puzzle/${puzzle.id}/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hint_level: next }),
    }).catch(() => {})
  }, [hintLevel, puzzle.hints.length, puzzle.id, isFinished])

  const skip = useCallback(async () => {
    if (isFinished) return
    setStatus('revealed')
    chime('give-up')
    setPuddlePresence({ details: 'Saw the solution', state: 'Daily brain teaser' })
    // Persist skip server-side
    fetch(`/api/puzzle/${puzzle.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer: '__skip__',
        elapsed_seconds: elapsed,
        hints_used: hintLevel,
        attempts,
        status: 'revealed',
      }),
    }).catch(() => {})
    recordDaily({
      state: 'revealed',
      title: puzzle.title,
      issueNo,
      puzzleId: puzzle.id,
    })
  }, [isFinished, puzzle.id, puzzle.title, elapsed, hintLevel, attempts, issueNo])

  const visibleHints = puzzle.hints.slice(0, hintLevel)

  const inputConfig = puzzle.input_config as any

  const solutionHref = `/solution?id=${puzzle.id}`

  return (
    <div
      className="flex flex-col"
      style={{ background: 'var(--color-bg)', fontFeatureSettings: '"ss01","cv02"' }}
    >
      {/* ─── Header ─── */}
      <PuzzleHeader
        issueNo={issueNo}
        vol={vol}
        compact={compact}
      />

      {/* ─── Body ─── */}
      <div className="flex">
        <div
          className="flex flex-col flex-1 min-w-0 px-4 pt-5 pb-8 md:px-8 md:pt-6"
        >
          {/* Kicker + title */}
          <div className="mb-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="italic text-accent tracking-[0.1px]"
                style={{ fontSize: compact ? 13 : 14 }}
              >
                {genreLabel(puzzle.genre)}
              </span>
              <span className="text-hair-strong">·</span>
              <DifficultyDots value={puzzle.difficulty} compact={compact} />
            </div>
            <h1
              className="font-medium leading-[1.06] tracking-tight"
              style={{
                fontSize: compact ? 30 : 40,
                letterSpacing: compact ? -0.4 : -0.8,
                color: 'var(--color-ink)',
              }}
            >
              {puzzle.title}
            </h1>
          </div>

          {/* Prompt */}
          <div
            className="my-5 max-w-[640px]"
            style={{ fontSize: compact ? 16.5 : 19, lineHeight: 1.6, color: 'var(--color-ink)' }}
          >
            {puzzle.prompt.map((para, i) => {
              const isDataLine = i === 1 && puzzle.input_type !== 'freetext'
              return (
                <p
                  key={i}
                  className="mb-3"
                  style={isDataLine ? {
                    fontFamily: '"Crimson Pro", Georgia, serif',
                    fontVariantNumeric: 'tabular-nums',
                    background: 'var(--color-paper)',
                    border: '1px solid var(--color-hair)',
                    borderRadius: 10,
                    padding: compact ? '12px 16px' : '14px 20px',
                    fontSize: compact ? 18 : 22,
                  } : undefined}
                >
                  {para}
                </p>
              )
            })}
          </div>

          {/* Hints */}
          {visibleHints.length > 0 && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div style={{ flex: 1, height: 1, background: 'var(--color-hair-strong)' }} />
                <span className="italic text-ink-muted" style={{ fontSize: 12, letterSpacing: '0.5px' }}>hints</span>
                <div style={{ flex: 1, height: 1, background: 'var(--color-hair-strong)' }} />
              </div>
              <div className="flex flex-col gap-2 mb-8 max-w-[640px]">
                {visibleHints.map((hint, i) => (
                  <div
                    key={i}
                    className="animate-reveal"
                    style={{
                      background: 'var(--color-paper)',
                      border: '1px solid var(--color-hair)',
                      borderRadius: compact ? 12 : 14,
                      padding: compact ? '12px 14px' : '14px 18px',
                      fontSize: compact ? 14.5 : 15.5,
                      color: 'var(--color-ink)',
                    }}
                  >
                    <span
                      className="italic mr-2"
                      style={{ color: 'var(--color-ink-muted)', fontSize: compact ? 12 : 13 }}
                    >
                      Hint {i + 1}
                    </span>
                    {hint}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Answer zone header */}
          <div
            className="max-w-[640px] mb-4"
            style={{ borderTop: '1px solid var(--color-hair)', paddingTop: 20 }}
          >
            <span className="italic text-ink-muted" style={{ fontSize: 13 }}>Your answer</span>
          </div>

          {/* Input zone */}
          <div
            className="relative max-w-[640px]"
            style={{ opacity: status === 'revealed' ? 0.7 : 1 }}
          >
            <div className={shaking ? 'animate-shake' : ''}>
              {puzzle.input_type === 'choice' && inputConfig?.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                  {inputConfig.options.map((opt: string, i: number) => {
                    const picked = answer === opt
                    const isCorrect = isFinished && status === 'correct' && picked
                    return (
                      <button
                        key={opt}
                        disabled={isFinished}
                        onClick={() => { if (!isFinished) { setAnswer(opt); chime('select') } }}
                        className="active:scale-[0.96]"
                        style={{
                          background: isCorrect
                            ? 'var(--color-success)'
                            : picked
                            ? 'var(--color-ink)'
                            : 'var(--color-paper)',
                          color: isCorrect || picked ? 'var(--color-paper)' : 'var(--color-ink)',
                          border: `1px solid ${isCorrect ? 'var(--color-success)' : picked ? 'var(--color-ink)' : 'var(--color-hair-strong)'}`,
                          borderRadius: compact ? 12 : 14,
                          padding: compact ? '12px 14px' : '14px 18px',
                          cursor: isFinished ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontFamily: 'inherit',
                          transform: picked && !isCorrect ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.18s var(--ease-puddle)',
                        }}
                      >
                        <span
                          className="font-medium"
                          style={{
                            fontSize: 11,
                            letterSpacing: '0.5px',
                            opacity: 0.55,
                            color: isCorrect || picked ? 'inherit' : 'var(--color-ink-muted)',
                          }}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span style={{ fontSize: compact ? 19 : 22, fontWeight: 500 }}>{opt}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {puzzle.input_type === 'numeric' && (
                <NumericStepper
                  value={answer}
                  onChange={setAnswer}
                  locked={isFinished}
                  min={inputConfig?.min ?? 0}
                  max={inputConfig?.max ?? 999}
                  compact={compact}
                />
              )}

              {puzzle.input_type === 'freetext' && (
                <input
                  type="text"
                  value={answer}
                  disabled={isFinished}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submit() }}
                  placeholder="Type your answer…"
                  style={{
                    width: '100%',
                    fontSize: compact ? 20 : 24,
                    padding: compact ? '12px 16px' : '14px 20px',
                    borderRadius: 12,
                    border: '1px solid var(--color-hair-strong)',
                    background: 'var(--color-paper)',
                    color: 'var(--color-ink)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
              )}
            </div>

            {/* Status line */}
            <div
              className="mt-2"
              style={{ fontSize: 15, fontStyle: 'italic', minHeight: 22 }}
            >
              {status === 'correct' && (
                <span className="animate-burst" style={{ color: 'var(--color-success)' }}>
                  ✓ Nicely done.
                </span>
              )}
              {status === 'wrong' && (
                <span style={{ color: 'var(--color-accent)' }}>Not quite — try again.</span>
              )}
              {status === 'revealed' && (
                <span className="text-ink-muted">Puzzle revealed.</span>
              )}
            </div>
          </div>

          {/* Actions row */}
          <div
            className="flex items-center gap-2 flex-wrap mt-3 pt-3"
            style={{ borderTop: '1px dashed var(--color-hair-strong)' }}
          >
            <GhostButton
              onClick={revealHint}
              disabled={hintLevel >= puzzle.hints.length || isFinished}
            >
              ◐ Hint {hintLevel}/{puzzle.hints.length}
              <span className="italic text-ink-muted ml-1" style={{ fontSize: compact ? 12 : 13 }}>· free</span>
            </GhostButton>

            <GhostButton
              onClick={() => { setShowScratch(v => !v); chime('notes') }}
              active={showScratch}
            >
              Notes
            </GhostButton>

            <GhostButton onClick={skip} disabled={isFinished}>
              Give up
            </GhostButton>

            <div className="flex-1" />

            {attempts > 0 && !isFinished && (
              <span className="italic text-ink-muted text-[13px] mr-1">
                {attempts} {attempts === 1 ? 'try' : 'tries'}
              </span>
            )}

            <button
              onClick={submit}
              disabled={!answer.toString().trim() || isFinished || submitting}
              className="transition-all duration-[180ms] font-medium hover:-translate-y-[2px] active:scale-[0.96] active:translate-y-0"
              style={{
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                borderRadius: 14,
                padding: compact ? '10px 18px' : '12px 22px',
                fontSize: compact ? 14 : 16,
                fontFamily: 'inherit',
                opacity: !answer.toString().trim() || isFinished ? 0.4 : 1,
                cursor: !answer.toString().trim() || isFinished ? 'default' : 'pointer',
                boxShadow: 'var(--shadow-btn)',
                border: 'none',
              }}
            >
              {isFinished ? '✓ Done' : submitting ? 'Checking…' : 'Check answer'}
            </button>
          </div>

          {/* Mobile scratchpad */}
          {showScratch && (
            <div className="md:hidden mt-4" style={{ borderTop: '1px solid var(--color-hair)', paddingTop: 14 }}>
              <textarea
                value={scratch}
                onChange={e => setScratch(e.target.value)}
                placeholder="Think out loud…"
                style={{
                  width: '100%', minHeight: 120, resize: 'vertical',
                  background: 'var(--color-paper)',
                  border: '1px solid var(--color-hair)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 14,
                  lineHeight: 1.55,
                  fontFamily: 'inherit',
                  color: 'var(--color-ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Post-solve panel */}
          {isFinished && (
            <PostSolvePanel
              status={status}
              hintLevel={hintLevel}
              attempts={attempts}
              solutionHref={solutionHref}
              compact={compact}
              issueNo={issueNo}
              title={puzzle.title}
              streakBeforeToday={streakBeforeToday}
              earnedXp={earnedXp}
              xpBeforeToday={xpBeforeToday}
            />
          )}
        </div>

        {/* Desktop scratchpad side panel */}
        <div className="hidden md:block flex-shrink-0" style={{
          width: showScratch ? 260 : 0,
          borderLeft: showScratch ? '1px solid var(--color-hair)' : 'none',
          background: 'var(--color-paper)',
          transition: 'width 0.35s var(--ease-puddle)',
          overflow: 'hidden',
        }}>
          <div style={{ width: 260, height: '100%', padding: 18, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] italic text-ink-muted">Scratch</span>
              <button
                onClick={() => setShowScratch(false)}
                className="text-ink-muted hover:text-ink text-lg leading-none"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ×
              </button>
            </div>
            <textarea
              value={scratch}
              onChange={e => setScratch(e.target.value)}
              placeholder="Think out loud…"
              className="flex-1 resize-none bg-transparent text-ink outline-none"
              style={{ fontSize: 13, lineHeight: 1.55, border: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PuzzleHeader({ issueNo, vol, compact }: { issueNo: number; vol: number; compact: boolean }) {
  return (
    <div
      className="flex items-center flex-shrink-0"
      style={{
        padding: compact ? '12px 18px 10px' : '14px 32px 12px',
        borderBottom: '1px solid var(--color-hair)',
      }}
    >
      <a
        href="/"
        className="flex items-center gap-2 no-underline"
        aria-label="puddle — back to today"
        style={{ color: 'inherit' }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 20, height: 20,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '2px',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <i style={{ background: 'var(--color-ink)', display: 'block' }} />
          <i style={{ background: 'var(--color-accent)', display: 'block' }} />
          <i style={{ background: 'var(--color-accent)', display: 'block' }} />
          <i style={{ background: 'var(--color-ink)', display: 'block' }} />
        </span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.3px', lineHeight: 1 }}>puddle</div>
          <div className="italic text-ink-muted" style={{ fontSize: 11.5, marginTop: 1 }}>
            Vol. {toRoman(vol)} <span style={{ color: 'var(--color-accent)' }}>·</span> No. {issueNo}
          </div>
        </div>
      </a>
    </div>
  )
}

function DifficultyDots({ value, compact }: { value: number; compact: boolean }) {
  const labels = ['', 'gentle', 'medium', 'hard', 'spicy', 'wicked']
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{
            width: compact ? 6 : 7,
            height: compact ? 6 : 7,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            opacity: n <= value ? 1 : 0.18,
            display: 'inline-block',
          }}
        />
      ))}
      <span className="italic text-ink-muted ml-1" style={{ fontSize: compact ? 12 : 13 }}>
        {labels[value]}
      </span>
    </span>
  )
}

function NumericStepper({
  value,
  onChange,
  locked,
  min,
  max,
  compact,
}: {
  value: string
  onChange: (v: string) => void
  locked: boolean
  min: number
  max: number
  compact: boolean
}) {
  const num = value === '' ? 0 : parseInt(value, 10)
  const set = (n: number) => onChange(String(Math.max(min, Math.min(max, n))))
  const btnStyle: React.CSSProperties = {
    width: compact ? 40 : 48,
    height: compact ? 52 : 60,
    fontSize: 22,
    fontFamily: 'inherit',
    background: 'var(--color-paper)',
    border: '1px solid var(--color-hair-strong)',
    cursor: locked ? 'default' : 'pointer',
    color: 'var(--color-ink)',
    transition: 'all 0.18s var(--ease-puddle)',
  }
  return (
    <div className="flex items-center gap-0" style={{ maxWidth: 200 }}>
      <button
        disabled={locked}
        onClick={() => { set(num - 1); chime('step') }}
        className="active:scale-[0.93] transition-transform duration-[120ms]"
        style={{ ...btnStyle, borderRadius: '12px 0 0 12px', borderRight: 'none' }}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        disabled={locked}
        onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder="—"
        style={{
          width: compact ? 72 : 88,
          height: compact ? 52 : 60,
          textAlign: 'center',
          fontSize: compact ? 24 : 30,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'inherit',
          fontWeight: 500,
          border: '1px solid var(--color-hair-strong)',
          background: 'var(--color-paper)',
          color: 'var(--color-ink)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <button
        disabled={locked}
        onClick={() => { set(num + 1); chime('step') }}
        className="active:scale-[0.93] transition-transform duration-[120ms]"
        style={{ ...btnStyle, borderRadius: '0 12px 12px 0', borderLeft: 'none' }}
      >
        +
      </button>
    </div>
  )
}

function GhostButton({
  onClick,
  disabled,
  active,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="transition-all duration-[180ms] hover:-translate-y-px active:scale-[0.95]"
      style={{
        background: active ? 'var(--color-paper-deep)' : 'transparent',
        border: '1px solid var(--color-hair-strong)',
        borderRadius: 12,
        padding: '9px 14px',
        fontSize: 15,
        fontFamily: 'inherit',
        color: 'var(--color-ink)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {children}
    </button>
  )
}

function PostSolvePanel({
  status,
  hintLevel,
  attempts,
  solutionHref,
  compact,
  issueNo,
  title,
  streakBeforeToday,
  earnedXp,
  xpBeforeToday,
}: {
  status: Status
  hintLevel: number
  attempts: number
  solutionHref: string
  compact: boolean
  issueNo: number
  title: string
  streakBeforeToday?: number
  earnedXp: number | null
  xpBeforeToday?: { totalXp: number; level: number }
}) {
  const xpInfo = (earnedXp !== null && xpBeforeToday)
    ? totalXpToLevel(xpBeforeToday.totalXp + earnedXp)
    : null
  const leveledUp = xpInfo !== null && xpBeforeToday !== undefined && xpInfo.level > xpBeforeToday.level
  const [copied, setCopied] = useState(false)

  function handleShare() {
    // 🟫🟧 / 🟧🟫 mirrors the puddle logo: brown ink + terracotta accent squares.
    const lines = [
      `🟫🟧 Puddle · No. ${issueNo}`,
      `🟧🟫 ${title}`,
      '',
    ]
    if (status === 'correct') {
      const hintPart = hintLevel > 0 ? ` · ${hintLevel} hint${hintLevel === 1 ? '' : 's'}` : ''
      lines.push(`✅ Solved${hintPart}`)
      const streak = streakBeforeToday !== undefined ? streakBeforeToday + 1 : 0
      if (streak >= 2) lines.push(`🔥 ${streak}-day streak`)
    } else {
      lines.push('Revealed')
    }
    lines.push('solvepuddle.com')
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const params = new URLSearchParams()
  params.set('from', status === 'correct' ? 'solved' : 'revealed')
  if (status === 'correct') {
    params.set('hints', String(hintLevel))
  }
  const href = `${solutionHref}&${params.toString()}`

  return (
    <div
      className="animate-reveal mt-3 flex items-center gap-5 flex-wrap"
      style={{
        background: 'var(--color-paper)',
        border: '1px solid var(--color-hair)',
        borderRadius: 14,
        padding: compact ? '14px 18px' : '16px 22px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex-1" style={{ minWidth: 160 }}>
        <div
          className="font-medium"
          style={{
            fontSize: 19,
            color: status === 'correct' ? 'var(--color-success)' : 'var(--color-ink)',
            marginBottom: 3,
            letterSpacing: -0.2,
          }}
        >
          {status === 'correct' ? 'Nicely done.' : 'See you tomorrow.'}
        </div>
        <div className="italic text-ink-muted" style={{ fontSize: 14.5 }}>
          {status === 'correct'
            ? <>Solved{hintLevel > 0 && <> with <strong style={{ color: 'var(--color-ink)', fontWeight: 500 }}>{hintLevel}</strong> hint{hintLevel === 1 ? '' : 's'}</>}{attempts > 0 && <>{hintLevel > 0 ? ',' : ''} after <strong style={{ color: 'var(--color-ink)', fontWeight: 500 }}>{attempts}</strong> {attempts === 1 ? 'try' : 'tries'}</>}.</>
            : <>Puzzle revealed. Read the worked solution below.</>
          }
        </div>
        {status === 'correct' && streakBeforeToday !== undefined && streakBeforeToday + 1 >= 2 && (
          <div
            className="animate-reveal"
            style={{ fontSize: 13, marginTop: 5, color: 'var(--color-accent)', fontStyle: 'italic' }}
          >
            🔥 {streakBeforeToday + 1}-day streak
          </div>
        )}
        {status === 'correct' && earnedXp !== null && (
          <div
            className="animate-burst"
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-success)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              +{earnedXp} XP
            </span>
            {xpInfo && (
              <>
                <span style={{ fontSize: 11, color: 'var(--color-hair-strong)' }}>·</span>
                <span
                  className="italic"
                  style={{ fontSize: 13, color: leveledUp ? 'var(--color-success)' : 'var(--color-ink-muted)' }}
                >
                  {leveledUp ? `✦ Level ${xpInfo.level}` : `Level ${xpInfo.level}`}
                </span>
                <div
                  style={{
                    width: 60, height: 4,
                    background: 'var(--color-paper-deep)',
                    borderRadius: 2, overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(xpInfo.xpInLevel / xpInfo.xpForLevel) * 100}%`,
                      height: '100%',
                      background: 'var(--color-success)',
                      transition: 'width 0.8s var(--ease-puddle)',
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleShare}
          className="transition-all duration-[180ms] hover:-translate-y-px active:scale-[0.96]"
          style={{
            background: copied ? 'var(--color-paper-deep)' : 'transparent',
            border: '1px solid var(--color-hair-strong)',
            borderRadius: 12,
            padding: compact ? '9px 14px' : '11px 16px',
            fontSize: compact ? 13 : 14,
            fontFamily: 'inherit',
            color: copied ? 'var(--color-success)' : 'var(--color-ink)',
            cursor: 'pointer',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {copied ? '✓ Copied' : 'Share result'}
        </button>
        <a
          href={href}
          className="flex items-center gap-2 font-medium no-underline transition-all duration-[180ms] hover:-translate-y-px"
          style={{
            background: 'var(--color-ink)',
            color: 'var(--color-paper)',
            borderRadius: 14,
            padding: compact ? '10px 18px' : '12px 20px',
            fontSize: compact ? 14 : 15,
            fontFamily: 'inherit',
            boxShadow: 'var(--shadow-btn)',
            whiteSpace: 'nowrap' as const,
          }}
        >
          Read the worked solution →
        </a>
      </div>
    </div>
  )
}

function genreLabel(genre: string): string {
  const map: Record<string, string> = {
    logic: 'Logic & Deduction',
    quant: 'Quant & Interview',
    pattern: 'Pattern & Sequence',
    lateral: 'Lateral Riddle',
    wordplay: 'Wordplay',
    deduction: 'Deduction',
  }
  return map[genre] ?? genre
}

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
  let result = ''
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i] }
  }
  return result
}
