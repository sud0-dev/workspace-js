import { useEffect, useState } from 'react'
import { cn } from './utils'

type ThemeMode = 'light' | 'dark' | 'auto'

const OPTIONS: { value: ThemeMode; label: string; glyph: string }[] = [
  { value: 'light', label: 'Light', glyph: '○' },
  { value: 'dark', label: 'Dark', glyph: '●' },
  { value: 'auto', label: 'Auto', glyph: '◐' },
]

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored
  return 'auto'
}

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)
  if (mode === 'auto') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', mode)
  document.documentElement.style.colorScheme = resolved
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    const m = getInitialMode()
    setMode(m)
    applyThemeMode(m)
  }, [])

  useEffect(() => {
    if (mode !== 'auto') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  function pick(next: ThemeMode) {
    try { window.localStorage.setItem('theme', next) } catch { /* private mode */ }
    applyThemeMode(next)
    setMode(next)
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="mono inline-flex h-7 items-center border-x border-[var(--rule)]"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === mode
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => pick(opt.value)}
            className={cn(
              'inline-flex h-full items-center justify-center gap-1 px-2 text-[0.72rem] uppercase tracking-[0.14em] transition',
              active
                ? 'bg-[var(--ember-soft)] text-[var(--ink)]'
                : 'text-[var(--ink-faint)] hover:bg-[color:color-mix(in_oklab,var(--ember)_8%,transparent)] hover:text-[var(--ink)]',
            )}
          >
            <span className="text-[0.95rem] leading-none">{opt.glyph}</span>
          </button>
        )
      })}
    </div>
  )
}
