import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Masthead from '../components/Masthead'

import appCss from '@workspace/ui/styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'color-scheme', content: 'light dark' },
      { name: 'theme-color', content: '#0e1418' },
      { title: 'Foundry · Rust REPL in your browser' },
      {
        name: 'description',
        content:
          'A Rust REPL in your browser. Compile via play.rust-lang.org, output streamed into typeset cells. No signup, no telemetry.',
      },
      { property: 'og:title', content: 'Foundry · Rust REPL' },
      {
        property: 'og:description',
        content:
          'A Rust REPL in your browser. Compile via play.rust-lang.org, output streamed into typeset cells.',
      },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/rust-icon.svg' },
      { rel: 'alternate icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/rust-icon.svg' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[920px] flex-col items-start justify-center px-6">
      <p className="kicker mb-3 text-[var(--kicker)]">404 · cast aside</p>
      <h1 className="display max-w-[18ch] text-[clamp(2rem,5vw,3.6rem)] leading-[0.98] tracking-[-0.025em] text-[var(--ink)]">
        Nothing forged here.
      </h1>
      <p className="mt-4 max-w-[48ch] text-[var(--ink-soft)]">
        That path doesn&rsquo;t match any route in the foundry.
      </p>
      <div className="mt-6 flex gap-3 text-[0.78rem] uppercase tracking-[0.14em]">
        <Link to="/" className="text-[var(--ember)] no-underline">
          → editor
        </Link>
        <Link to="/notebook" className="text-[var(--ember)] no-underline">
          → notebook
        </Link>
        <Link to="/about" className="text-[var(--ember)] no-underline">
          → about
        </Link>
      </div>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans text-[var(--ink)] antialiased">
        <Masthead />
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
