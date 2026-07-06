import { useState } from 'react'
import { probeGeolocation, probeClipboard, probeMotion, type ProbeResult } from '#/lib/probes'

type ProbeDef = {
  id: string
  label: string
  action: string
  description: string
  run: () => Promise<ProbeResult>
}

type ProbeState = { status: 'idle' | 'running' | 'done'; result?: ProbeResult }

const PROBES: ProbeDef[] = [
  {
    id: 'geo',
    label: 'Precise location',
    action: 'Request GPS',
    description: 'IP puts you in a city. One "Allow" puts you on a doorstep — to a few meters.',
    run: probeGeolocation,
  },
  {
    id: 'clipboard',
    label: 'Clipboard contents',
    action: 'Read clipboard',
    description: 'Whatever you last copied — a password, an address — is one grant away.',
    run: probeClipboard,
  },
  {
    id: 'motion',
    label: 'Motion sensors',
    action: 'Read motion',
    description: 'Accelerometer and gyroscope streams — usable to fingerprint and track.',
    run: probeMotion,
  },
]

// Interactive consent demos — these prompt, so the visitor sees the cost of "Allow".
export default function ProbePanel() {
  const [states, setStates] = useState<Record<string, ProbeState>>({})

  async function trigger(probe: ProbeDef) {
    setStates((s) => ({ ...s, [probe.id]: { status: 'running' } }))
    const result = await probe.run()
    setStates((s) => ({ ...s, [probe.id]: { status: 'done', result } }))
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {PROBES.map((probe) => {
        const state = states[probe.id] ?? { status: 'idle' }
        return (
          <div
            key={probe.id}
            className="flex flex-col rounded-md border border-[var(--rule)] bg-[var(--card)] p-4"
          >
            <p className="mono text-[0.72rem] uppercase tracking-wider text-[var(--ink-faint)]">
              {probe.label}
            </p>
            <p className="mt-1.5 flex-1 text-[0.8rem] leading-snug text-[var(--ink-soft)]">
              {probe.description}
            </p>
            <div className="mt-3 min-h-[1.4rem]">
              {state.status === 'done' && state.result ? (
                <p
                  className="mono text-[0.78rem] leading-snug break-words"
                  style={{ color: state.result.error ? 'var(--signal)' : 'var(--stamp)' }}
                >
                  {state.result.error ? `blocked: ${state.result.error}` : state.result.data}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => trigger(probe)}
              disabled={state.status === 'running'}
              className="mono mt-3 rounded-sm border border-[var(--rule-strong)] px-3 py-1.5 text-[0.76rem] text-[var(--ink)] transition hover:border-[var(--stamp)] hover:text-[var(--stamp)] disabled:opacity-50"
            >
              {state.status === 'running' ? 'requesting…' : probe.action}
            </button>
          </div>
        )
      })}
    </div>
  )
}
