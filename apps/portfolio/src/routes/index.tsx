import { createFileRoute } from '@tanstack/react-router'

type Project = {
  slug: string
  name: string
  tagline: string
  href: string
  status: 'live' | 'building' | 'planned'
  stack: string[]
  shipped?: string
}

const SITE_URL = 'https://sud0.dev'

const PROJECTS: Project[] = [
  {
    slug: 'foundry',
    name: 'foundry',
    tagline: 'A Rust REPL in your browser. Compile once, run locally forever.',
    href: 'https://foundry-rs.sud0.dev',
    status: 'live',
    stack: ['tanstack-start', 'codemirror', 'cloudflare-workers', 'rust'],
    shipped: '2026-06',
  },
  {
    slug: 'crates',
    name: 'crates.sud0.dev',
    tagline: 'A faster UI for crates.io. Drop-in: swap the domain in any URL.',
    href: 'https://crates.sud0.dev',
    status: 'building',
    stack: ['tanstack-start', 'cloudflare-workers', 'crates.io-api', 'rust'],
  },
]

export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => ({
    meta: [
      { title: 'sud0.dev · naman’s side projects console' },
      {
        name: 'description',
        content:
          'Side projects by Naman — mostly TypeScript, with tinkering in Rust on the side. Pair-programmed with Claude. Home of Foundry (Rust REPL) and more.',
      },
      { name: 'author', content: 'Naman' },
      {
        name: 'keywords',
        content:
          'side projects, naman, sud0.dev, foundry, rust, rust repl, typescript, tanstack start, cloudflare workers, bun',
      },
      { property: 'og:title', content: 'sud0.dev · side projects' },
      {
        property: 'og:description',
        content: 'Side projects by Naman, pair-programmed with Claude.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:site_name', content: 'sud0.dev' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'sud0.dev · side projects' },
      {
        name: 'twitter:description',
        content: 'Side projects by Naman, pair-programmed with Claude.',
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
          '@type': 'Person',
          name: 'Naman',
          url: 'https://insanenaman.com',
          sameAs: ['https://insanenaman.com', 'https://github.com/sud0-dev'],
          worksFor: { '@type': 'Organization', name: 'sud0.dev' },
        }),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'sud0.dev side projects',
          url: SITE_URL,
          author: {
            '@type': 'Person',
            name: 'Naman',
            url: 'https://insanenaman.com',
          },
          hasPart: PROJECTS.map((p) => ({
            '@type': 'SoftwareApplication',
            name: p.name,
            description: p.tagline,
            url: p.href,
            applicationCategory: 'DeveloperApplication',
          })),
        }),
      },
    ],
  }),
})

function HomePage() {
  return (
    <main className="mx-auto max-w-[1080px] px-4 pb-24 pt-12 sm:px-6">
      <Hero />
      <Projects />
      <Whoami />
    </main>
  )
}

function Hero() {
  return (
    <section className="mb-14">
      <p className="prompt mono mb-3 text-[0.78rem] text-[var(--ink-faint)]">
        whoami
      </p>
      <h1 className="display text-[clamp(1.6rem,3.4vw,2.4rem)] leading-[1.25] tracking-[-0.02em] text-[var(--ink)]">
        naman <span className="text-[var(--ink-faint)]">/</span>{' '}
        <span className="text-[var(--ember)]">indiehacker</span>{' '}
        <span className="text-[var(--ink-faint)]">at</span>{' '}
        <span className="text-[var(--ember)]">work</span>
        <span className="cursor ml-2" aria-hidden />
      </h1>
      <pre className="mono mt-5 max-w-[72ch] whitespace-pre-wrap text-[0.92rem] leading-[1.7] text-[var(--ink-soft)]">
{`> indiehacker shipping side projects on weekends.
> mostly typescript. ${' '}some rust. each one shipped in a Bun monorepo
> with Claude as my pair-programmer. some make it. some don’t.
> what made it is below.`}
      </pre>
    </section>
  )
}

function Projects() {
  return (
    <section className="border-t border-[var(--rule)] pt-8">
      <h2 className="prompt kicker mb-4 text-[var(--ember)]">
        ls projects/
      </h2>

      <div className="overflow-hidden border border-[var(--rule)] bg-[var(--paper-tinted)]">
        <table className="mono w-full border-collapse text-[0.84rem]">
          <thead>
            <tr className="border-b border-[var(--rule)] text-[0.66rem] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
              <Th>name</Th>
              <Th>status</Th>
              <Th>shipped</Th>
              <Th className="hidden md:table-cell">stack</Th>
              <Th className="text-right">url</Th>
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map((p) => (
              <ProjectRow key={p.slug} project={p} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

type ProjectRowProps = { project: Project }
function ProjectRow({ project }: ProjectRowProps) {
  return (
    <tr className="group border-b border-[var(--rule)] last:border-b-0 transition-colors hover:bg-[var(--ember-soft)]">
      <Td>
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="line font-bold text-[var(--ink)] no-underline group-hover:text-[var(--ember)]"
        >
          {project.name}
        </a>
        <div className="mt-1 text-[0.78rem] font-normal text-[var(--ink-soft)]">
          {project.tagline}
        </div>
      </Td>
      <Td>
        <StatusGlyph status={project.status} />
      </Td>
      <Td className="text-[var(--ink-soft)] tabular">
        {project.shipped ?? '—'}
      </Td>
      <Td className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((s) => (
            <span key={s} className="tag">{s}</span>
          ))}
        </div>
      </Td>
      <Td className="text-right">
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[var(--ember)] no-underline"
        >
          <span>open</span>
          <span aria-hidden>↗</span>
        </a>
      </Td>
    </tr>
  )
}

type StatusGlyphProps = { status: Project['status'] }
function StatusGlyph({ status }: StatusGlyphProps) {
  const map = {
    live: { label: 'live', color: 'var(--ember)' },
    building: { label: 'wip', color: 'var(--amber)' },
    planned: { label: 'idea', color: 'var(--ink-faint)' },
  } as const
  const { label, color } = map[status]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        aria-hidden
      />
      <span className="text-[0.72rem] uppercase tracking-[0.14em] text-[var(--ink-soft)]">
        {label}
      </span>
    </span>
  )
}

type ThProps = { children: React.ReactNode; className?: string }
function Th({ children, className = '' }: ThProps) {
  return (
    <th className={`px-4 py-2 text-left font-normal ${className}`}>{children}</th>
  )
}
function Td({ children, className = '' }: ThProps) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>
}

function Whoami() {
  return (
    <section className="mt-16 border-t border-[var(--rule)] pt-6">
      <p className="prompt mono mb-2 text-[0.74rem] text-[var(--ink-faint)]">
        cat ~/.about
      </p>
      <p className="mono text-[0.86rem] leading-[1.65] text-[var(--ink-soft)]">
        by{' '}
        <a
          href="https://insanenaman.com"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--ember)]"
        >
          naman
        </a>
        . sources live in{' '}
        <a
          href="https://github.com/sud0-dev/workspace-js"
          target="_blank"
          rel="noreferrer"
        >
          sud0-dev/workspace-js
        </a>
        . pair-programmed with claude.
      </p>
    </section>
  )
}
