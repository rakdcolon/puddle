// Per-device accessibility preferences. Like the theme (see ./theme.ts) these live in
// localStorage rather than the account so they can be applied before first paint with no
// flash and work for signed-out visitors. Each preference toggles a class on <html>;
// globals.css keys its overrides off those classes, composing with the `dark` class.

export type A11yKey = 'contrast' | 'font' | 'motion'

export type A11yPref = Record<A11yKey, boolean>

// localStorage key + the <html> class each preference toggles.
export const A11Y_SETTINGS: Record<A11yKey, { storageKey: string; className: string }> = {
  contrast: { storageKey: 'puddle.a11y.contrast', className: 'contrast-high' },
  font: { storageKey: 'puddle.a11y.font', className: 'font-readable' },
  motion: { storageKey: 'puddle.a11y.motion', className: 'reduce-motion' },
}

const KEYS = Object.keys(A11Y_SETTINGS) as A11yKey[]

export function getA11y(): A11yPref {
  const pref: A11yPref = { contrast: false, font: false, motion: false }
  if (typeof localStorage === 'undefined') return pref
  for (const k of KEYS) {
    pref[k] = localStorage.getItem(A11Y_SETTINGS[k].storageKey) === '1'
  }
  return pref
}

export function applyA11y(pref: A11yPref): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const k of KEYS) {
    root.classList.toggle(A11Y_SETTINGS[k].className, pref[k])
  }
}

export function setA11y(key: A11yKey, value: boolean): void {
  try {
    localStorage.setItem(A11Y_SETTINGS[key].storageKey, value ? '1' : '0')
  } catch {
    // Private mode / storage disabled — still apply for this session.
  }
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle(A11Y_SETTINGS[key].className, value)
  }
}

// Minified, dependency-free version of the read+apply logic, inlined into a blocking
// <script> in <head> so the classes are on <html> before paint (no flash). Built from
// A11Y_SETTINGS so the keys/classes can never drift from the runtime logic above.
const PAIRS = JSON.stringify(KEYS.map(k => [A11Y_SETTINGS[k].storageKey, A11Y_SETTINGS[k].className]))
export const A11Y_INIT_SCRIPT = `(function(){try{var d=document.documentElement,m=${PAIRS},i;for(i=0;i<m.length;i++){if(localStorage.getItem(m[i][0])==='1')d.classList.add(m[i][1]);}}catch(e){}})();`
