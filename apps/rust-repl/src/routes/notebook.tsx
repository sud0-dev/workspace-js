import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { Notebook, NotebookSkeleton } from '#/components/repl/Notebook'

export const Route = createFileRoute('/notebook')({
  component: NotebookPage,
  head: () => ({
    meta: [
      { title: 'Foundry · Rust notebook' },
      {
        name: 'description',
        content:
          'Notebook-style Rust REPL — multiple cells, per-cell output, shared session. Compiles via play.rust-lang.org.',
      },
    ],
  }),
})

function NotebookPage() {
  return (
    <main className="mx-auto max-w-[1480px] px-4 pb-12 pt-6 sm:px-6">
      <Hero />
      <div className="mt-6">
        <ClientOnly fallback={<NotebookSkeleton />}>
          <Notebook />
        </ClientOnly>
      </div>
    </main>
  )
}

function Hero() {
  return (
    <section>
      <p className="kicker mb-3 flex items-center gap-3 text-[var(--kicker)]">
        <span className="inline-block h-px w-10 bg-[var(--ember)]" />
        <span>rust · notebook · cells share a session</span>
      </p>
      <h1 className="display max-w-[20ch] text-[clamp(2rem,5vw,3.6rem)] leading-[0.98] tracking-[-0.025em] text-[var(--ink)]">
        Compose Rust.{' '}
        <span className="display-italic text-[var(--ember)]">Cell by cell</span>
        .
      </h1>
    </section>
  )
}
