import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import ThemeToggle from '@workspace/ui/theme-toggle'

function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[1080px] flex-col items-start justify-center px-4 sm:px-6">
      <p className="prompt mono mb-3 text-[0.78rem] text-[var(--ink-faint)]">
        cat 404
      </p>
      <h1 className="display text-[clamp(1.6rem,3.4vw,2.4rem)] leading-[1.25] tracking-[-0.02em] text-[var(--ink)]">
        nothing here. <span className="text-[var(--ember)]">yet</span>.
      </h1>
      <p className="mono mt-4 text-[0.86rem] text-[var(--ink-soft)]">
        <a href="/" className="text-[var(--ember)]">$ cd ~/</a>
      </p>
    </main>
  )
}

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'color-scheme', content: 'light dark' },
      { name: 'theme-color', content: '#0e1418' },
      { title: 'sud0.dev · side projects' },
      {
        name: 'description',
        content:
          'Side projects by Naman, pair-programmed with Claude. Built on sud0.dev.',
      },
      { property: 'og:title', content: 'sud0.dev' },
      {
        property: 'og:description',
        content: 'Side projects by Naman, pair-programmed with Claude.',
      },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
      { rel: 'alternate icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/icon.svg' },
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
      <body className="mono text-[var(--ink)] antialiased">
        <header className="border-b border-[var(--rule)] bg-[var(--paper)]">
          <div className="mx-auto flex h-12 max-w-[1080px] items-center gap-4 px-4 sm:px-6">
            <a href="/" className="mono inline-flex items-baseline gap-1 text-[0.92rem] font-bold no-underline text-[var(--ink)]">
              <span className="text-[var(--ember)]">~/</span>
              <span>sud0.dev</span>
            </a>
            <span className="mono hidden text-[0.74rem] text-[var(--ink-faint)] sm:inline">
              · naman&rsquo;s side projects console
            </span>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
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
