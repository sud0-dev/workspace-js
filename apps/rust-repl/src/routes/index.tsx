import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { SingleFile, SingleFileSkeleton } from '#/components/repl/SingleFile'

export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => ({
    meta: [
      { title: 'Foundry · Rust REPL in your browser' },
      {
        name: 'description',
        content:
          'Single-file Rust editor in your browser. Compiles via play.rust-lang.org, output streams back, source persists locally.',
      },
    ],
  }),
})

function HomePage() {
  return (
    <main className="mx-auto max-w-[1480px] px-4 pb-12 pt-6 sm:px-6">
      <Hero />
      <div className="mt-6">
        <ClientOnly fallback={<SingleFileSkeleton />}>
          <SingleFile />
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
        <span>rust · in your browser</span>
      </p>
      <h1 className="display max-w-[20ch] text-[clamp(2rem,5vw,3.6rem)] leading-[0.98] tracking-[-0.025em] text-[var(--ink)]">
        Type Rust.{' '}
        <span className="display-italic text-[var(--ember)]">Run it where it lives</span>
        .
      </h1>
    </section>
  )
}
