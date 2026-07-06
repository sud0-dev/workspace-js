import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import ThemeToggle from '@workspace/ui/theme-toggle'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

const SITE_TITLE = 'What does my browser know about me? — exposed.sud0.dev'
const SITE_DESC =
  'See every piece of information your browser leaks to any website you visit — IP, location, device, GPU, fingerprint, and network — with no permission prompts. A live privacy-awareness report.'
const SITE_URL = 'https://exposed.sud0.dev'

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'exposed.sud0.dev',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: SITE_DESC,
  url: SITE_URL,
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'color-scheme', content: 'light dark' },
      { name: 'theme-color', content: '#16181c' },
      { title: SITE_TITLE },
      { name: 'description', content: SITE_DESC },
      {
        name: 'keywords',
        content:
          'what is my ip, browser fingerprint, what my browser knows, privacy check, ip lookup, device fingerprint, webrtc leak, am i being tracked',
      },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:description', content: SITE_DESC },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:site_name', content: 'exposed.sud0.dev' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: SITE_TITLE },
      { name: 'twitter:description', content: SITE_DESC },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'canonical', href: SITE_URL },
      { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
    ],
    scripts: [{ type: 'application/ld+json', children: JSON_LD }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="sans text-[var(--ink)] antialiased">
        <header className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[var(--surface)] backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-3 px-4 sm:px-6">
            <Link
              to="/"
              className="display flex items-baseline gap-0.5 text-[1.05rem] no-underline text-[var(--ink)]"
            >
              <span>exposed</span>
              <span className="text-[var(--stamp)]">.sud0.dev</span>
            </Link>
            <span className="mono hidden text-[0.72rem] text-[var(--ink-faint)] sm:inline">
              · what your browser reveals
            </span>
            <nav className="ml-auto flex items-center gap-4 text-[0.82rem]">
              <Link
                to="/protect"
                className="text-[var(--ink-faint)] no-underline transition hover:text-[var(--ink)]"
              >
                protect yourself
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
