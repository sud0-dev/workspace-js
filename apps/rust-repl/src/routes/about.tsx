import { createFileRoute } from '@tanstack/react-router'
import { getBuildId } from '#/lib/buildGate'

export const Route = createFileRoute('/about')({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: 'Foundry · About' },
      {
        name: 'description',
        content:
          'How Foundry is built — the stack, the architecture, and credits.',
      },
    ],
  }),
})

function AboutPage() {
  return (
    <main className="mx-auto max-w-[920px] px-4 pb-20 pt-8 sm:px-6">
      <header>
        <p className="kicker mb-3 flex items-center gap-3 text-[var(--kicker)]">
          <span className="inline-block h-px w-10 bg-[var(--ember)]" />
          <span>about · foundry</span>
        </p>
        <h1 className="display max-w-[18ch] text-[clamp(2rem,5vw,3.6rem)] leading-[0.98] tracking-[-0.025em] text-[var(--ink)]">
          What it is.{' '}
          <span className="display-italic text-[var(--ember)]">How it&rsquo;s made</span>
          .
        </h1>
      </header>

      <Section title="What">
        <p>
          Foundry is a Rust REPL that lives in your browser tab. Two modes — a single-file
          editor for quick scratch work, and a notebook for composing snippets cell by cell.
          Source persists in your browser; identical re-runs are served from an in-tab cache.
        </p>
      </Section>

      <Section title="How it works">
        <ol className="list-decimal space-y-2 pl-5 text-[var(--ink-soft)]">
          <li>
            You type Rust in a CodeMirror 6 editor with the <code>lang-rust</code> grammar.
          </li>
          <li>
            <kbd className="mono">⇧↵</kbd> sends the source to a TanStack Start server function
            running on Cloudflare Workers.
          </li>
          <li>
            The Worker calls <a href="https://play.rust-lang.org" target="_blank" rel="noreferrer">play.rust-lang.org</a>{' '}
            and streams the result back as a typed event stream (started → stderr/stdout → done).
          </li>
          <li>
            On a clean run, the event sequence is persisted to IndexedDB keyed by a hash of
            your source. Re-running the same snippet is zero-network.
          </li>
          <li>
            A Service Worker caches the static assets — once you&rsquo;ve loaded the page,
            cached snippets work offline.
          </li>
        </ol>
      </Section>

      <Section title="Stack">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StackRow k="Framework" v="TanStack Start (React 19, SSR + streaming server functions)" />
          <StackRow k="Bundler" v="Vite 8 + Rolldown" />
          <StackRow k="Editor" v="CodeMirror 6 + @codemirror/lang-rust" />
          <StackRow k="Styling" v="Tailwind 4 (CSS-first @theme), Fraunces + IBM Plex" />
          <StackRow k="State" v="@tanstack/react-store, localStorage, IndexedDB" />
          <StackRow k="Compile" v="play.rust-lang.org /execute (swappable via FOUNDRY_COMPILE_URL)" />
          <StackRow k="Deploy" v="Cloudflare Workers + static assets (wrangler)" />
          <StackRow k="Offline" v="Service Worker, PWA installable" />
          <StackRow k="Tests" v="Vitest + jsdom + Testing Library, Playwright for E2E" />
          <StackRow k="Runtime" v="Bun (dev + scripts)" />
        </dl>
      </Section>

      <Section title="Credits">
        <p>
          Built by{' '}
          <a
            href="https://insanenaman.com"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--ember)]"
          >
            Naman
          </a>
          , pair-programmed with Cursor. Source on{' '}
          <a
            href="https://github.com/insanenaman/foundry-rs"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          .
        </p>
        <p className="mono mt-3 text-[0.74rem] text-[var(--ink-faint)]">
          build · {getBuildId()}
        </p>
      </Section>
    </main>
  )
}

type SectionProps = { title: string; children: React.ReactNode }
function Section({ title, children }: SectionProps) {
  return (
    <section className="mt-10 border-t border-[var(--rule)] pt-6">
      <h2 className="kicker mb-3 text-[var(--kicker)]">{title}</h2>
      <div className="space-y-3 text-[1rem] leading-[1.65] text-[var(--ink-soft)]">
        {children}
      </div>
    </section>
  )
}

type StackRowProps = { k: string; v: string }
function StackRow({ k, v }: StackRowProps) {
  return (
    <div className="border-l border-[var(--rule)] pl-3">
      <dt className="kicker text-[var(--ink-faint)]">{k}</dt>
      <dd className="mono text-[0.86rem] text-[var(--ink)]">{v}</dd>
    </div>
  )
}
