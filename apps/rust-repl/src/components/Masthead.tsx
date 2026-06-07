import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'
import { ModeTabs } from './ModeTabs'

const GITHUB_URL = 'https://github.com/insanenaman/foundry-rs'

export default function Masthead() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--rule)] bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="group flex items-baseline gap-2 no-underline" aria-label="Foundry">
          <span className="display text-[1.35rem] leading-none tracking-[-0.02em] text-[var(--ink)]">
            Foundry
          </span>
          <span className="display-italic text-[1.05rem] leading-none text-[var(--ember)]">
            rust&nbsp;repl
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="View source on GitHub"
            title="View source on GitHub"
            className="inline-flex h-7 w-7 items-center justify-center text-[var(--ink-soft)] transition hover:text-[var(--ink)]"
          >
            <GitHubGlyph />
          </a>
          <ThemeToggle />
        </div>
      </div>
      <div className="border-t border-[var(--rule)]">
        <ModeTabs />
      </div>
    </header>
  )
}

function GitHubGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  )
}
