'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { User, UserSettings, HintPacing } from '@/types'
import { getStoredPref, setThemePref, type ThemePref } from '@/lib/theme'
import { getA11y, setA11y, type A11yKey, type A11yPref } from '@/lib/a11y'

interface Props {
  user: User
  settings: UserSettings
}

export default function SettingsClient({ user, settings: initial }: Props) {
  const [settings, setSettings] = useState(initial)
  const [displayName, setDisplayName] = useState(initial.display_name ?? user.display_name)
  const [toast, setToast] = useState<'saved' | 'error' | false>(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Theme lives in localStorage (per-device), not the account settings, so it
  // can apply before paint. Read the stored value after mount to avoid a
  // hydration mismatch (server has no localStorage).
  const [themePref, setThemePrefState] = useState<ThemePref>('auto')
  useEffect(() => {
    setThemePrefState(getStoredPref())
  }, [])

  // Accessibility prefs are also per-device (localStorage), read after mount to avoid
  // a hydration mismatch. See @/lib/a11y.
  const [a11y, setA11yState] = useState<A11yPref>({ contrast: false, font: false, motion: false })
  useEffect(() => {
    setA11yState(getA11y())
  }, [])
  const toggleA11y = (key: A11yKey, value: boolean) => {
    setA11y(key, value)
    setA11yState(s => ({ ...s, [key]: value }))
  }

  const showToast = (kind: 'saved' | 'error') => {
    setToast(kind)
    setTimeout(() => setToast(false), 1800)
  }

  const patchSetting = useCallback(async (patch: Partial<UserSettings>) => {
    const prev = settings
    setSettings(s => ({ ...s, ...patch }))
    const res = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      showToast('saved')
    } else {
      setSettings(prev)
      showToast('error')
    }
  }, [settings])

  const handleNameChange = (name: string) => {
    setDisplayName(name)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await patchSetting({ display_name: name })
    }, 600)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await fetch('/api/user', { method: 'DELETE' })
    router.push('/')
  }

  return (
    <div className="space-y-10">
      {/* Account */}
      <Section label="account">
        <Field label="Display name">
          <input
            type="text"
            value={displayName}
            onChange={e => handleNameChange(e.target.value)}
            style={{
              fontSize: 16, padding: '10px 14px',
              borderRadius: 12, border: '1px solid var(--color-hair-strong)',
              background: 'var(--color-paper)', color: 'var(--color-ink)',
              fontFamily: 'inherit', width: '100%', maxWidth: 320, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </Field>
        <Field label="Email">
          <span className="italic text-ink-muted" style={{ fontSize: 15 }}>
            {user.email} <span style={{ fontSize: 13 }}>— Linked through your Google account.</span>
          </span>
        </Field>
        <Field label="Member since">
          <span className="italic text-ink-muted" style={{ fontSize: 15 }}>
            {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </Field>
      </Section>

      {/* Appearance */}
      <Section label="appearance">
        <Field label="Theme">
          <SegmentedControl
            value={themePref}
            options={[
              { value: 'auto', label: 'Automatic' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            onChange={v => {
              setThemePref(v as ThemePref)
              setThemePrefState(v as ThemePref)
            }}
          />
        </Field>
      </Section>

      {/* Accessibility */}
      <Section label="accessibility">
        <Field label="High contrast">
          <Toggle checked={a11y.contrast} onChange={v => toggleA11y('contrast', v)} />
        </Field>
        <Field label="Cleaner text">
          <Toggle checked={a11y.font} onChange={v => toggleA11y('font', v)} />
        </Field>
        <Field label="Reduce motion">
          <Toggle checked={a11y.motion} onChange={v => toggleA11y('motion', v)} />
        </Field>
      </Section>

      {/* Experience */}
      <Section label="experience">
        <Field label="Sound effects">
          <Toggle
            checked={settings.sound}
            onChange={v => patchSetting({ sound: v })}
          />
        </Field>
        <Field label="Hint pacing">
          <SegmentedControl
            value={settings.hint_pacing}
            options={[
              { value: 'instant', label: 'Instant' },
              { value: '5s-pause', label: '5s pause' },
            ]}
            onChange={v => patchSetting({ hint_pacing: v as HintPacing })}
          />
        </Field>
        <Field label="Show streak counter">
          <Toggle
            checked={settings.show_streak}
            onChange={v => patchSetting({ show_streak: v })}
          />
        </Field>
      </Section>

      {/* Data */}
      <Section label="data">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDeleteDialog(true)}
            style={{
              fontSize: 15, padding: '10px 18px',
              borderRadius: 12,
              border: '1px solid var(--color-accent)',
              background: 'transparent',
              color: 'var(--color-accent)',
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            Delete account
          </button>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="italic text-ink-muted hover:text-ink transition-colors duration-[180ms]"
              style={{ background: 'none', border: 'none', fontSize: 15, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </form>
        </div>
      </Section>

      {/* Toast */}
      <div
        style={{
          position: 'fixed', bottom: 24, left: '50%', transform: `translateX(-50%) translateY(${toast ? 0 : 12}px)`,
          opacity: toast ? 1 : 0,
          transition: 'all 0.22s var(--ease-puddle)',
          background: toast === 'error' ? 'var(--color-accent)' : 'var(--color-ink)',
          color: 'var(--color-paper)',
          borderRadius: 10, padding: '8px 18px',
          fontSize: 14, fontStyle: 'italic',
          pointerEvents: 'none', zIndex: 50,
        }}
      >
        {toast === 'error' ? '● Could not save — try again.' : '● Saved.'}
      </div>

      {/* Delete dialog */}
      {showDeleteDialog && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'var(--color-scrim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowDeleteDialog(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-paper)', borderRadius: 18,
              padding: '32px 36px', maxWidth: 460, width: '90vw',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <h2 id="delete-title" className="font-medium mb-3" style={{ fontSize: 24, letterSpacing: -0.4 }}>
              Delete your account?
            </h2>
            <p className="text-ink-muted mb-7" style={{ fontSize: 16, lineHeight: 1.6 }}>
              This permanently removes your solving record, settings, and any other data. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                style={{
                  padding: '11px 20px', borderRadius: 12,
                  border: '1px solid var(--color-hair-strong)',
                  background: 'var(--color-paper)', color: 'var(--color-ink)',
                  fontSize: 15, fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '11px 20px', borderRadius: 12,
                  background: 'var(--color-accent)', color: 'white',
                  border: 'none',
                  fontSize: 15, fontFamily: 'inherit',
                  cursor: deleting ? 'default' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="italic font-medium mb-5"
        style={{
          fontSize: 15, color: 'var(--color-ink-muted)', letterSpacing: '0.05px',
          borderBottom: '1px solid var(--color-hair)',
          paddingBottom: 8, textTransform: 'capitalize',
        }}
      >
        {label}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span style={{ fontSize: 16, color: 'var(--color-ink)' }}>{label}</span>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 46, height: 26,
        borderRadius: 13,
        background: checked ? 'var(--color-accent)' : 'var(--color-paper-deep)',
        border: '1px solid var(--color-hair-strong)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.18s var(--ease-puddle)',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2, left: checked ? 21 : 2,
          width: 20, height: 20,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 2px rgba(58,47,34,.2)',
          transition: 'left 0.18s var(--ease-puddle)',
        }}
      />
    </button>
  )
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--color-paper-deep)',
        borderRadius: 12,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 14px', borderRadius: 10,
            fontSize: 14, fontFamily: 'inherit',
            cursor: 'pointer', border: 'none',
            background: value === opt.value ? 'var(--color-paper)' : 'transparent',
            color: value === opt.value ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            boxShadow: value === opt.value ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.18s var(--ease-puddle)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
