import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import ThemeToggle from '@workspace/ui/theme-toggle'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[1080px] flex-col items-start justify-center px-4 sm:px-6">
      <p className="kicker mb-3 text-[var(--ink-faint)]">404</p>
      <h1 className="display text-[clamp(1.8rem,3.8vw,2.6rem)] leading-[1.15] tracking-[-0.02em] text-[var(--ink)]">
        Crate not in the ledger.
      </h1>
      <p className="mt-4 text-[var(--ink-soft)]">
        <Link to="/" className="text-[var(--ember)]">← back to registry</Link>
      </p>
    </main>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'color-scheme', content: 'light dark' },
      { name: 'theme-color', content: '#0e0c0a' },
      { title: 'crates.sud0.dev · a faster crates.io' },
      {
        name: 'description',
        content:
          'A faster UI for the Rust crate registry. Instant search, dense package pages, dependency tree, version diffs. Drop-in: replace crates.io with crates.sud0.dev.',
      },
      { property: 'og:title', content: 'crates.sud0.dev · a faster crates.io' },
      {
        property: 'og:description',
        content:
          'A faster UI for the Rust crate registry. Drop-in alternative to crates.io.',
      },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
      { rel: 'alternate icon', href: '/favicon.ico' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="sans text-[var(--ink)] antialiased">
        <header className="border-b border-[var(--rule)] bg-[var(--paper)]">
          <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-5 px-4 sm:px-6">
            <Link to="/" className="display flex items-baseline gap-1 text-[1.1rem] no-underline text-[var(--ink)]">
              <span>crates</span>
              <span className="text-[var(--ember)]">.sud0.dev</span>
            </Link>
            <span className="mono hidden text-[0.74rem] text-[var(--ink-faint)] sm:inline">
              · a faster crates.io
            </span>
            <nav className="ml-auto flex items-center gap-4 text-[0.82rem]">
              <a
                href="https://crates.io"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--ink-faint)] no-underline transition hover:text-[var(--ink)]"
              >
                upstream ↗
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            { name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
