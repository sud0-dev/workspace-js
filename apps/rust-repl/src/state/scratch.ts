import { Store } from '@tanstack/react-store'
import type { CellStatus, EvalEvent, OutputChunk } from './notebook'

export type ScratchState = {
  source: string
  status: CellStatus
  output: OutputChunk[]
  startedAt?: number
  durationMs?: number
  cacheHit?: boolean
  exitCode?: number
}

const STORAGE_KEY = 'foundry:scratch:v1'

const SEED = `fn main() {
    let crew = ["rust", "wasm", "tanstack"];
    println!("hello, foundry — running {} modules in your browser.", crew.len());
    for (i, m) in crew.iter().enumerate() {
        println!("  {:02}. {}", i + 1, m);
    }
}
`

function initialState(): ScratchState {
  return { source: SEED, status: 'idle', output: [] }
}

function load(): ScratchState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ScratchState
  } catch {
    return null
  }
}

export const scratchStore = new Store<ScratchState>(initialState())

let hydrated = false
export function hydrateScratch() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  const stored = load()
  if (stored) scratchStore.setState(() => stored)
  let raf = 0
  scratchStore.subscribe(() => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scratchStore.state))
      } catch {
        /* quota or private mode */
      }
    })
  })
}

function appendChunk(
  prev: OutputChunk[],
  stream: OutputChunk['stream'],
  text: string,
): OutputChunk[] {
  const last = prev[prev.length - 1]
  if (last && last.stream === stream) {
    return [...prev.slice(0, -1), { ...last, text: last.text + text }]
  }
  return [...prev, { stream, text }]
}

function reduce(s: ScratchState, ev: EvalEvent): ScratchState {
  switch (ev.kind) {
    case 'started':
      return { ...s, status: 'compiling', startedAt: ev.startedAt, output: [] }
    case 'stdout':
      return { ...s, status: 'running', output: appendChunk(s.output, 'stdout', ev.chunk) }
    case 'stderr':
      return { ...s, status: 'running', output: appendChunk(s.output, 'stderr', ev.chunk) }
    case 'diagnostic':
      return {
        ...s,
        status: ev.level === 'error' ? 'error' : s.status,
        output: [...s.output, { stream: 'diagnostic', text: ev.message, level: ev.level }],
      }
    case 'result':
      return { ...s, output: [...s.output, { stream: 'result', text: ev.value }] }
    case 'done':
      return {
        ...s,
        status: ev.exitCode === 0 ? 'ok' : 'error',
        durationMs: ev.durationMs,
        cacheHit: ev.cacheHit,
        exitCode: ev.exitCode,
      }
    case 'error':
      return {
        ...s,
        status: 'error',
        output: [...s.output, { stream: 'system', text: ev.message }],
      }
  }
}

export const scratchActions = {
  updateSource(source: string) {
    scratchStore.setState((s) => ({ ...s, source }))
  },
  clearOutput() {
    scratchStore.setState((s) => ({
      ...s,
      output: [],
      status: 'idle',
      durationMs: undefined,
      cacheHit: undefined,
      exitCode: undefined,
    }))
  },
  applyEvent(ev: EvalEvent) {
    scratchStore.setState((s) => reduce(s, ev))
  },
  reset() {
    scratchStore.setState(() => initialState())
  },
}
