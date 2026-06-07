import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '#/lib/utils'

type Tab = { to: string; label: string }

const TABS: Tab[] = [
  { to: '/', label: 'Editor' },
  { to: '/notebook', label: 'Notebook' },
  { to: '/about', label: 'About' },
]

export function ModeTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <nav className="mx-auto flex max-w-[1480px] items-end gap-1 px-4 sm:px-6">
      {TABS.map((t) => {
        const active = isActive(pathname, t.to)
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              'group relative -mb-px px-3.5 py-2.5 text-[0.78rem] uppercase tracking-[0.16em] no-underline transition',
              active
                ? 'text-[var(--ink)]'
                : 'text-[var(--ink-faint)] hover:text-[var(--ink-soft)]',
            )}
          >
            {t.label}
            <span
              className={cn(
                'pointer-events-none absolute inset-x-3.5 -bottom-px h-px',
                active ? 'bg-[var(--ember)]' : 'bg-transparent',
              )}
            />
          </Link>
        )
      })}
    </nav>
  )
}

function isActive(pathname: string, to: string) {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(to + '/')
}
