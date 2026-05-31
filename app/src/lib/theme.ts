// Theme preference handling. Stored per-device in localStorage (not the DB) so
// it can be applied before first paint with no flash and works for signed-out
// visitors. The resolved light/dark choice is expressed as a `dark` class on
// <html>, which flips the CSS color variables in globals.css.

export type ThemePref = 'auto' | 'light' | 'dark'

export const THEME_KEY = 'puddle.theme'

export function getStoredPref(): ThemePref {
  if (typeof localStorage === 'undefined') return 'auto'
  const v = localStorage.getItem(THEME_KEY)
  return v === 'light' || v === 'dark' ? v : 'auto'
}

export function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

export function resolveIsDark(pref: ThemePref): boolean {
  return pref === 'dark' || (pref === 'auto' && systemPrefersDark())
}

export function applyTheme(pref: ThemePref): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolveIsDark(pref))
}

export function setThemePref(pref: ThemePref): void {
  try {
    localStorage.setItem(THEME_KEY, pref)
  } catch {
    // Private mode / storage disabled — still apply for this session.
  }
  applyTheme(pref)
}

// Minified, dependency-free version of the resolve+apply logic, inlined into a
// blocking <script> in <head> so the correct theme is on <html> before paint.
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem('${THEME_KEY}')||'auto';var d=p==='dark'||(p==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`
