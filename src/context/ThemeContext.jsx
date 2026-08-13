import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'

const ThemeContext = createContext(null)

export const STORAGE_KEY = 'clarity-theme'
export const THEMES = ['light', 'dark', 'system']

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

/** Only place that touches the class — everything else goes through setTheme. */
function paint(mode) {
  const dark = mode === 'dark' || (mode === 'system' && prefersDark())
  document.documentElement.classList.toggle('dark', dark)
}

function readStored() {
  const stored = localStorage.getItem(STORAGE_KEY)
  return THEMES.includes(stored) ? stored : 'system'
}

/**
 * Applies the colour scheme and keeps it in sync with three sources: the local
 * choice, the saved preference once the user loads, and the OS setting while in
 * "system" mode.
 *
 * localStorage is written on every change so the boot script in index.html can
 * paint the right theme before React mounts, avoiding a flash of the wrong one.
 */
export function ThemeProvider({ children }) {
  const { preferences } = useAuth()
  const [theme, setThemeState] = useState(readStored)

  const setTheme = useCallback((next) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
    paint(next)
  }, [])

  // The stored preference wins once it arrives: it follows the user across
  // devices, where localStorage only describes this browser.
  useEffect(() => {
    const saved = preferences?.theme
    if (saved && THEMES.includes(saved) && saved !== theme) setTheme(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences?.theme])

  useEffect(() => {
    paint(theme)
  }, [theme])

  // Follow the OS while it is the one in charge.
  useEffect(() => {
    if (theme !== 'system') return undefined
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => paint('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      /** What is actually on screen — "system" resolved to one or the other. */
      resolved: theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme,
    }),
    [theme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
