import type { Section } from '#/lib/collect/types'
import type { ClientReport } from '#/lib/collect'
import UniquenessMeter from './UniquenessMeter'
import GreetIp from './GreetIp'

type Props = {
  network: Section | null
  report: ClientReport | null
  revealed: boolean
}

// Pull a marquee value out of a section by field key.
function pick(section: Section | null, key: string): string | null {
  return section?.fields.find((f) => f.key === key)?.value ?? null
}

type MarqueeProps = { label: string; value: string | null; revealed: boolean }

function Marquee({ label, value, revealed }: MarqueeProps) {
  return (
    <div className="min-w-0 border-t border-[var(--rule)] py-2.5 first:border-t-0 sm:border-t-0 sm:border-l sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
      <p className="mono text-[0.66rem] uppercase tracking-wider text-[var(--ink-faint)]">{label}</p>
      <p className="display mt-1 text-[0.98rem] leading-tight text-[var(--ink)]">
        {value === null ? (
          <span className="text-[var(--ink-faint)]">unavailable</span>
        ) : (
          <span className="redact redact-block" data-open={revealed}>
            <span className="redact-val block break-all">{value}</span>
          </span>
        )}
      </p>
    </div>
  )
}

// The hero — a declassified case file whose subject is the visitor.
export default function Dossier({ network, report, revealed }: Props) {
  const clientSections = report?.sections ?? []
  const fingerprint = clientSections.find((s) => s.id === 'fingerprint') ?? null

  return (
    <section className="relative overflow-hidden border-b border-[var(--rule)]">
      <div className="mx-auto max-w-[1100px] px-4 pt-14 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
        {/* Greet the visitor by the exact public IP the edge already logged. */}
        <p className="mono mb-5 text-[0.95rem] text-[var(--ink-soft)] sm:text-[1.05rem]">
          hello, <GreetIp ip={pick(network, 'IP address') ?? 'stranger'} />
        </p>

        <h1 className="display mt-1 max-w-[18ch] text-[clamp(2.1rem,7vw,4.2rem)] leading-[0.98] tracking-[-0.03em] text-[var(--ink)]">
          You opened one link. This is your file.
        </h1>

        <p className="mt-5 max-w-[54ch] text-[1rem] leading-relaxed text-[var(--ink-soft)] sm:text-[1.08rem]">
          Every website you visit reads this the moment it loads — no login, no cookie banner, no
          click required. Below is what <em>this</em> page just collected about you. Nothing is sent
          anywhere; it all stays in your browser.
        </p>

        <div className="mt-9 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="rounded-md border border-[var(--rule)] bg-[var(--card)] p-4 sm:p-5">
            <div className="grid gap-0 sm:grid-cols-4 sm:gap-0">
              <Marquee label="IP address" value={pick(network, 'IP address')} revealed={revealed} />
              <Marquee label="Location" value={pick(network, 'Approx. location')} revealed={revealed} />
              <Marquee label="Timezone" value={pick(clientSections.find((s) => s.id === 'locale') ?? null, 'Timezone')} revealed={revealed} />
              <Marquee label="GPU" value={pick(fingerprint, 'GPU renderer')} revealed={revealed} />
            </div>
          </div>

          {report ? (
            <UniquenessMeter bits={report.bitsOfEntropy} fingerprint={report.fingerprint} revealed={revealed} />
          ) : (
            <div className="rounded-md border border-dashed border-[var(--rule)] p-5 text-[0.85rem] text-[var(--ink-faint)]">
              <span className="mono">scanning your browser…</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
