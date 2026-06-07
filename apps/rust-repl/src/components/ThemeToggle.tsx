import { useEffect, useRef, useState } from 'react'
import { cn } from '#/lib/utils'

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
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(next: ThemeMode) {
    setMode(next)
    applyThemeMode(next)
    window.localStorage.setItem('theme', next)
    setOpen(false)
  }

  const current = OPTIONS.find((o) => o.value === mode) ?? OPTIONS[2]

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${current.label}. Click to change.`}
        className="mono inline-flex h-7 items-center gap-1.5 border-x border-[var(--rule)] px-2.5 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--ink-soft)] transition hover:bg-[var(--ember-soft)] hover:text-[var(--ink)]"
      >
        <span className="text-[0.95rem] leading-none">{current.glyph}</span>
        <span>{current.label}</span>
        <span className="text-[0.6rem] text-[var(--ink-faint)]">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[10rem] border border-[var(--rule)] bg-[var(--surface-strong)] shadow-[0_18px_44px_-12px_rgba(0,0,0,0.35)] backdrop-blur"
        >
          {OPTIONS.map((opt) => {
            const active = opt.value === mode
            return (
              <button
                key={opt.value}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => pick(opt.value)}
                className={cn(
                  'mono flex w-full items-center gap-2.5 px-3 py-2 text-left text-[0.78rem] transition',
                  active
                    ? 'bg-[var(--ember-soft)] text-[var(--ink)]'
                    : 'text-[var(--ink-soft)] hover:bg-[color:color-mix(in_oklab,var(--ember)_8%,transparent)] hover:text-[var(--ink)]',
                )}
              >
                <span className="text-[0.95rem] leading-none">{opt.glyph}</span>
                <span>{opt.label}</span>
                {active && (
                  <span className="ml-auto text-[var(--ember)]">✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
