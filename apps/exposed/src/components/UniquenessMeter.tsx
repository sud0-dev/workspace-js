type Props = {
  bits: number
  fingerprint: string
  revealed: boolean
}

// Turn a bits-of-entropy estimate into a "1 in N" odds string.
function oddsFromBits(bits: number): string {
  const n = Math.pow(2, Math.min(bits, 40))
  if (n >= 1_000_000_000) return `1 in ${(n / 1_000_000_000).toFixed(1)} billion`
  if (n >= 1_000_000) return `1 in ${(n / 1_000_000).toFixed(1)} million`
  if (n >= 1_000) return `1 in ${Math.round(n / 1_000)}k`
  return `1 in ${Math.round(n)}`
}

// The signature stat: how rare this exact configuration is.
export default function UniquenessMeter({ bits, fingerprint, revealed }: Props) {
  const pct = Math.min(100, Math.round((bits / 40) * 100))

  return (
    <div className="rounded-md border border-[var(--stamp)] bg-[var(--stamp-soft)] p-4 sm:p-5">
      <p className="kicker">Fingerprint uniqueness</p>
      <div className="mt-2 flex items-end gap-3">
        <span className="display text-[clamp(1.8rem,5vw,2.6rem)] leading-none text-[var(--ink)]">
          <span className="redact" data-open={revealed}>
            <span className="redact-val tabular">{oddsFromBits(bits)}</span>
          </span>
        </span>
      </div>
      <p className="mt-2 text-[0.82rem] leading-snug text-[var(--ink-soft)]">
        Roughly {bits} bits of identifying information — enough to single you out of a crowd
        without a cookie, a login, or your consent.
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--stamp)_22%,transparent)]">
        <div
          className="h-full rounded-full bg-[var(--stamp)] transition-[width] duration-1000 ease-out"
          style={{ width: revealed ? `${pct}%` : '0%' }}
        />
      </div>
      <p className="mono mt-3 text-[0.72rem] text-[var(--ink-faint)]">
        digest <span className="text-[var(--ink-soft)]">{revealed ? fingerprint : '········'}</span>
      </p>
    </div>
  )
}
