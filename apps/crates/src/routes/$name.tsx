import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { getCrate } from '#/server/fns'
import type { CrateDetail } from '#/server/types'

const SITE_URL = 'https://crates.sud0.dev'

export const Route = createFileRoute('/$name')({
  component: CratePage,
  loader: async ({ params }) => {
    const result = await getCrate({ data: { name: params.name } })
    if (!result.crate) throw notFound()
    return { crate: result.crate, source: result.source }
  },
  head: ({ params }) => {
    const name = params.name
    return {
      meta: [
        { title: `${name} · crates.sud0.dev` },
        {
          name: 'description',
          content: `Browse ${name} on a faster crates.io. README, versions, dependencies, and download stats — denser than the official UI.`,
        },
        { property: 'og:title', content: `${name} · Rust crate` },
        {
          property: 'og:description',
          content: `Faster UI for the ${name} Rust crate — versions, dependencies, downloads.`,
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${SITE_URL}/${name}` },
      ],
      links: [{ rel: 'canonical', href: `${SITE_URL}/${name}` }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareSourceCode',
            name,
            programmingLanguage: 'Rust',
            url: `${SITE_URL}/${name}`,
          }),
        },
      ],
    }
  },
})

function CratePage() {
  const { crate, source } = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-20 pt-8 sm:px-6">
      <p className="mono mb-2 text-[0.72rem] text-[var(--ink-faint)]">
        <Link to="/" className="no-underline hover:text-[var(--ink)]">crates</Link>
        <span className="px-1.5">/</span>
        <span className="text-[var(--ink)]">{crate.name}</span>
        {source !== 'live' && (
          <span className="ml-3 inline-flex items-center gap-1 text-[var(--ember)]">
            · from snapshot
          </span>
        )}
      </p>

      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--rule)] pb-6">
        <div>
          <h1 className="display text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.025em] text-[var(--ink)]">
            <span className="mono">{crate.name}</span>{' '}
            <span className="mono text-[0.4em] text-[var(--ember)]">{crate.maxVersion}</span>
          </h1>
          {crate.description && (
            <p className="mt-2 max-w-[68ch] text-[var(--ink-soft)]">{crate.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-[0.78rem]">
          {crate.homepage && (
            <a href={crate.homepage} target="_blank" rel="noreferrer" className="tag">
              homepage ↗
            </a>
          )}
          {crate.repository && (
            <a href={crate.repository} target="_blank" rel="noreferrer" className="tag">
              repo ↗
            </a>
          )}
          <a
            href={crate.documentation ?? `https://docs.rs/${crate.name}`}
            target="_blank"
            rel="noreferrer"
            className="tag"
          >
            docs.rs ↗
          </a>
          <a
            href={`https://crates.io/crates/${crate.name}`}
            target="_blank"
            rel="noreferrer"
            className="tag"
          >
            upstream ↗
          </a>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ReadmePane crate={crate} />
        <Sidebar crate={crate} />
      </div>
    </main>
  )
}

type PaneProps = { crate: CrateDetail }
function ReadmePane({ crate }: PaneProps) {
  return (
    <article className="border border-[var(--rule)] bg-[var(--paper-tinted)] p-6">
      <h2 className="kicker mb-3 text-[var(--ember)]">readme</h2>
      {crate.readme ? (
        <div className="mono whitespace-pre-wrap text-[0.86rem] leading-[1.7] text-[var(--ink-soft)]">
          {crate.readme}
        </div>
      ) : (
        <p className="text-[0.86rem] text-[var(--ink-faint)]">
          README fetch lands in phase 2b — the live API requires a second call
          per version. For now, view it upstream:{' '}
          <a
            href={`https://crates.io/crates/${crate.name}`}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--ember)]"
          >
            crates.io/crates/{crate.name} ↗
          </a>
        </p>
      )}
    </article>
  )
}

function Sidebar({ crate }: PaneProps) {
  return (
    <aside className="space-y-6">
      <Block title="install">
        <pre className="mono whitespace-pre-wrap rounded border border-[var(--rule)] bg-[var(--paper)] p-3 text-[0.78rem] text-[var(--ink)]">{`cargo add ${crate.name}`}</pre>
      </Block>

      <Block title="metadata">
        <Meta k="latest" v={crate.maxVersion} mono />
        <Meta k="msrv" v={crate.msrv ?? '—'} mono />
        <Meta k="license" v={crate.license ?? '—'} />
        <Meta k="updated" v={crate.updatedAt.slice(0, 10)} mono />
        <Meta k="downloads" v={fmtN(crate.downloads)} mono />
        <Meta k="recent (90d)" v={fmtN(crate.recentDownloads)} mono />
      </Block>

      {crate.features.length > 0 && (
        <Block title="features">
          <ul className="mono space-y-1 text-[0.78rem]">
            {crate.features.map((f) => (
              <li key={f.name}>
                <span className="text-[var(--ember)]">{f.name}</span>
                {f.deps.length > 0 && (
                  <span className="text-[var(--ink-faint)]"> = [{f.deps.join(', ')}]</span>
                )}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {crate.versions.length > 0 && (
        <Block title="versions">
          <ul className="mono space-y-1 text-[0.78rem]">
            {crate.versions.map((v, i) => (
              <li key={v} className="flex items-baseline justify-between gap-2">
                <span className={i === 0 ? 'text-[var(--ember)]' : 'text-[var(--ink-soft)]'}>
                  {v}
                </span>
                {i === 0 && <span className="kicker text-[var(--ink-faint)]">latest</span>}
              </li>
            ))}
          </ul>
        </Block>
      )}
    </aside>
  )
}

type BlockProps = { title: string; children: React.ReactNode }
function Block({ title, children }: BlockProps) {
  return (
    <section>
      <h3 className="kicker mb-2 text-[var(--ember)]">{title}</h3>
      <div>{children}</div>
    </section>
  )
}

type MetaProps = { k: string; v: string; mono?: boolean }
function Meta({ k, v, mono = false }: MetaProps) {
  return (
    <div className="flex items-baseline justify-between border-b border-dashed border-[var(--rule)] py-1.5 text-[0.8rem] last:border-b-0">
      <span className="text-[var(--ink-faint)]">{k}</span>
      <span className={`${mono ? 'mono tabular' : ''} text-[var(--ink)]`}>{v}</span>
    </div>
  )
}

function fmtN(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}
