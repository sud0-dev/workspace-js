import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { getNetwork } from '#/server/network'
import { runClientCollection, type ClientReport } from '#/lib/collect'
import type { Section } from '#/lib/collect/types'
import Dossier from '#/components/Dossier'
import FileSection from '#/components/FileSection'
import ProbePanel from '#/components/ProbePanel'

export const Route = createFileRoute('/')({
  // Network/geo is resolved at the edge per request, so it renders in the SSR
  // shell — reinforcing that it arrived before any client code ran.
  loader: async (): Promise<{ network: Section | null }> => {
    const { data } = await getNetwork()
    return { network: data }
  },
  component: Home,
})

function Home() {
  const { network } = Route.useLoaderData()
  const [report, setReport] = useState<ClientReport | null>(null)
  const [revealed, setRevealed] = useState(false)

  // Run the browser probes and trigger the declassification wipe after mount.
  useEffect(() => {
    let alive = true
    runClientCollection().then((r) => {
      if (alive) setReport(r)
    })
    const raf = requestAnimationFrame(() => setRevealed(true))
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [])

  const clientSections = report?.sections ?? []

  return (
    <main>
      <Dossier network={network} report={report} revealed={revealed} />

      <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {network ? <FileSection section={network} index={0} revealed={revealed} /> : null}
          {clientSections.map((section, i) => (
            <FileSection key={section.id} section={section} index={i + 1} revealed={revealed} />
          ))}
        </div>

        {!report ? (
          <p className="mono mt-6 text-center text-[0.8rem] text-[var(--ink-faint)]">
            reading your browser…
          </p>
        ) : null}

        <div className="divider" />

        <section>
          <p className="kicker">The cost of "Allow"</p>
          <h2 className="display mt-2 text-[clamp(1.5rem,4vw,2.2rem)] leading-tight text-[var(--ink)]">
            One click hands over far more
          </h2>
          <p className="mt-3 max-w-[60ch] text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">
            The file above needed no consent. These need a single tap on "Allow" — try them to see
            exactly what a site gains.
          </p>
          <div className="mt-6">
            <ProbePanel />
          </div>
        </section>

        <div className="divider" />

        {/* Send readers to the dedicated countermeasures page. */}
        <section className="flex flex-col items-start gap-3 rounded-md border border-[var(--rule)] bg-[var(--card)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="kicker">Seen enough?</p>
            <h2 className="display mt-1.5 text-[clamp(1.3rem,3.5vw,1.9rem)] leading-tight text-[var(--ink)]">
              Give away less
            </h2>
            <p className="mt-1 max-w-[56ch] text-[0.88rem] leading-snug text-[var(--ink-soft)]">
              Concrete steps to shrink your footprint — and answers to the questions this page raises.
            </p>
          </div>
          <Link
            to="/protect"
            className="mono shrink-0 rounded-sm border border-[var(--stamp)] px-4 py-2 text-[0.82rem] text-[var(--stamp)] no-underline transition hover:bg-[var(--stamp-soft)]"
          >
            protect yourself ↗
          </Link>
        </section>
      </div>

      <footer className="border-t border-[var(--rule)]">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-1 px-4 py-8 text-[0.8rem] text-[var(--ink-faint)] sm:px-6">
          <p>
            <span className="display text-[var(--ink)]">exposed</span>
            <span className="text-[var(--stamp)]">.sud0.dev</span> — a privacy-awareness tool. All
            readings stay in your browser.
          </p>
          <p className="mono text-[0.72rem]">No analytics · No cookies · No data leaves this device.</p>
        </div>
      </footer>
    </main>
  )
}
