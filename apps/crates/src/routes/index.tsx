import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { searchCrates } from '#/server/fns'
import type { CrateSummary } from '#/server/types'

const SITE_URL = 'https://crates.sud0.dev'

export const Route = createFileRoute('/')({
  component: HomePage,
  // SSR-load a "trending" seed (top crates by relevance for an empty/popular query)
  // so the page is useful before JS hydrates.
  loader: async () => {
    const seed = await searchCrates({ data: { q: 'serde' } }).catch(() => null)
    return { trending: seed?.crates ?? [] }
  },
  head: () => ({
    meta: [
      { title: 'crates.sud0.dev · a faster crates.io · Rust crate registry' },
      {
        name: 'description',
        content:
          'A faster UI for the Rust crate registry. Instant search across 150k+ crates, dense package pages, dependency tree visualizations, version diffs. Drop-in alternative to crates.io.',
      },
      { name: 'author', content: 'Naman' },
      {
        name: 'keywords',
        content:
          'rust, crates, crates.io, cargo, rust package registry, rust crate search, faster crates.io, rust package manager, cargo registry, rust libraries',
      },
      { property: 'og:title', content: 'crates.sud0.dev · a faster crates.io' },
      {
        property: 'og:description',
        content:
          'A faster UI for the Rust crate registry. Drop-in alternative to crates.io with instant search and dense package pages.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:site_name', content: 'crates.sud0.dev' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'crates.sud0.dev · a faster crates.io' },
      {
        name: 'twitter:description',
        content: 'Faster UI for the Rust crate registry. Drop-in alternative to crates.io.',
      },
    ],
    links: [
      { rel: 'canonical', href: SITE_URL },
      { rel: 'author', href: 'https://insanenaman.com' },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'crates.sud0.dev',
          alternateName: 'crates sud0',
          description: 'A faster UI for the Rust crate registry.',
          url: SITE_URL,
          inLanguage: 'en',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_URL}/{search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
          publisher: {
            '@type': 'Person',
            name: 'Naman',
            url: 'https://insanenaman.com',
          },
        }),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'crates.sud0.dev',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description: 'Drop-in alternative UI for the Rust crate registry.',
        }),
      },
    ],
  }),
})

function HomePage() {
  const { trending } = Route.useLoaderData()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<CrateSummary[] | null>(null)
  const [searching, setSearching] = useState(false)

  // Debounced live search via the server fn.
  useEffect(() => {
    const term = q.trim()
    if (term.length === 0) {
      setResults(null)
      return
    }
    setSearching(true)
    const handle = setTimeout(async () => {
      try {
        const r = await searchCrates({ data: { q: term } })
        setResults(r.crates)
      } finally {
        setSearching(false)
      }
    }, 200)
    return () => clearTimeout(handle)
  }, [q])

  function go(name: string) {
    void navigate({ to: '/$name', params: { name } })
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const top = (results ?? [])[0]
    if (top) go(top.name)
    else if (q.trim()) go(q.trim())
  }

  const display = results ?? trending

  return (
    <main className="mx-auto max-w-[1080px] px-4 pb-20 pt-12 sm:px-6">
      <Hero />
      <form onSubmit={onSubmit} className="mt-8">
        <label htmlFor="search" className="kicker mb-2 block text-[var(--ink-faint)]">
          find a crate
        </label>
        <div className="relative">
          <input
            id="search"
            autoFocus
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='try "serde" · "tokio" · "axum"'
            className="mono h-12 w-full border border-[var(--rule)] bg-[var(--paper-tinted)] px-4 pr-20 text-[0.95rem] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--ember)]"
          />
          <kbd className="mono pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-sm border border-[var(--rule)] bg-[var(--paper)] px-1.5 py-0.5 text-[0.66rem] text-[var(--ink-faint)]">
            /
          </kbd>
        </div>
      </form>

      <section className="mt-10">
        <h2 className="kicker mb-4 flex items-center gap-2 text-[var(--ember)]">
          <span>{results ? `results · ${display.length}` : 'popular'}</span>
          {searching && <span className="text-[var(--ink-faint)]">· searching…</span>}
        </h2>
        <CrateTable crates={display} onPick={go} />
      </section>

      <UrlSwapHint />
    </main>
  )
}

function Hero() {
  return (
    <section>
      <p className="kicker mb-3 flex items-center gap-3 text-[var(--ember)]">
        <span className="inline-block h-px w-10 bg-[var(--ember)]" />
        <span>a faster crates.io · drop-in</span>
      </p>
      <h1 className="display text-[clamp(2rem,5vw,3.6rem)] leading-[1.05] tracking-[-0.025em] text-[var(--ink)]">
        Browse <span className="text-[var(--ember)]">crates</span> without the wait.
      </h1>
      <p className="mt-4 max-w-[60ch] text-[1rem] leading-[1.6] text-[var(--ink-soft)]">
        Same data as crates.io. Faster pages, denser layout, instant search. Swap any URL:{' '}
        <span className="mono text-[var(--ink)]">crates.io</span>
        {' → '}
        <span className="mono text-[var(--ember)]">crates.sud0.dev</span>.
      </p>
    </section>
  )
}

type CrateTableProps = { crates: CrateSummary[]; onPick: (name: string) => void }
function CrateTable({ crates, onPick }: CrateTableProps) {
  if (crates.length === 0) {
    return (
      <div className="border border-dashed border-[var(--rule)] px-4 py-10 text-center text-[var(--ink-faint)]">
        no crates match.
      </div>
    )
  }
  return (
    <div className="overflow-hidden border border-[var(--rule)] bg-[var(--paper-tinted)]">
      <table className="w-full border-collapse text-[0.88rem]">
        <thead>
          <tr className="border-b border-[var(--rule)] text-[0.66rem] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
            <Th>crate</Th>
            <Th className="hidden md:table-cell">latest</Th>
            <Th className="hidden text-right md:table-cell">downloads</Th>
            <Th className="hidden lg:table-cell">updated</Th>
          </tr>
        </thead>
        <tbody>
          {crates.map((c) => (
            <tr
              key={c.name}
              onClick={() => onPick(c.name)}
              className="group cursor-pointer border-b border-[var(--rule)] last:border-b-0 transition-colors hover:bg-[var(--ember-soft)]"
            >
              <Td>
                <div className="mono font-bold text-[var(--ink)] group-hover:text-[var(--ember)]">
                  {c.name}
                </div>
                {c.description && (
                  <div className="mt-1 text-[0.82rem] font-normal text-[var(--ink-soft)]">
                    {c.description}
                  </div>
                )}
              </Td>
              <Td className="mono hidden text-[0.82rem] text-[var(--ink-soft)] tabular md:table-cell">
                {c.maxVersion}
              </Td>
              <Td className="mono hidden text-right text-[0.82rem] text-[var(--ink-soft)] tabular md:table-cell">
                {fmtN(c.downloads)}
              </Td>
              <Td className="mono hidden text-[0.82rem] text-[var(--ink-soft)] tabular lg:table-cell">
                {c.updatedAt.slice(0, 10)}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type ThProps = { children: React.ReactNode; className?: string }
function Th({ children, className = '' }: ThProps) {
  return <th className={`px-4 py-2 text-left font-normal ${className}`}>{children}</th>
}
function Td({ children, className = '' }: ThProps) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>
}

function fmtN(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

function UrlSwapHint() {
  return (
    <section className="mt-16 border-t border-[var(--rule)] pt-8">
      <h2 className="kicker mb-3 text-[var(--ember)]">drop-in</h2>
      <div className="mono space-y-1 text-[0.86rem] text-[var(--ink-soft)]">
        <p>
          <span className="text-[var(--ink-faint)]">https://</span>
          <span className="text-[var(--ink)]">crates.io</span>
          <span className="text-[var(--ink-faint)]">/crates/serde</span>
        </p>
        <p>
          <span className="text-[var(--ink-faint)]">https://</span>
          <span className="text-[var(--ember)]">crates.sud0.dev</span>
          <span className="text-[var(--ink-faint)]">/serde</span>
        </p>
      </div>
    </section>
  )
}
