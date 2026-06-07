import { Store } from '@tanstack/react-store'

export type EvalEvent =
  | { kind: 'started'; startedAt: number }
  | { kind: 'stdout'; chunk: string }
  | { kind: 'stderr'; chunk: string }
  | { kind: 'diagnostic'; level: 'error' | 'warning' | 'note'; message: string }
  | { kind: 'result'; value: string }
  | { kind: 'done'; exitCode: number; durationMs: number; cacheHit: boolean }
  | { kind: 'error'; message: string }

export type CellStatus = 'idle' | 'compiling' | 'running' | 'ok' | 'error' | 'stopped'

export type OutputChunk = {
  stream: 'stdout' | 'stderr' | 'diagnostic' | 'result' | 'system'
  text: string
  level?: 'error' | 'warning' | 'note'
}

export type Cell = {
  id: string
  index: number
  source: string
  status: CellStatus
  output: OutputChunk[]
  startedAt?: number
  durationMs?: number
  cacheHit?: boolean
  exitCode?: number
}

export type NotebookState = {
  sessionId: string
  cells: Cell[]
  activeCellId: string | null
}

const STORAGE_KEY = 'foundry:notebook:v1'
const SSR_SESSION_ID = 's_ssr'
const SSR_CELL_ID = 'c_ssr'

function uid(prefix = 'c') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`
}

function emptyCell(index: number, source = '', id?: string): Cell {
  return {
    id: id ?? uid(),
    index,
    source,
    status: 'idle',
    output: [],
  }
}

const SEED = `fn main() {
    let greeting = "hello, foundry";
    let crew = ["rust", "wasm", "tanstack"];
    println!("{greeting} — running {} modules in your browser.", crew.len());
    for (i, m) in crew.iter().enumerate() {
        println!("  {:02}. {}", i + 1, m);
    }
}
`

// SSR-safe: deterministic ids during render so server HTML matches first client paint.
// Real ids get generated when hydrateFromStorage() runs on the client.
function initialState(): NotebookState {
  return {
    sessionId: SSR_SESSION_ID,
    cells: [emptyCell(1, SEED, SSR_CELL_ID)],
    activeCellId: null,
  }
}

function freshClientState(): NotebookState {
  return {
    sessionId: uid('s'),
    cells: [emptyCell(1, SEED)],
    activeCellId: null,
  }
}

function loadFromStorage(): NotebookState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as NotebookState
    if (!parsed?.cells?.length) return null
    return parsed
  } catch {
    return null
  }
}

export const notebookStore = new Store<NotebookState>(initialState())

let hydrated = false
export function hydrateFromStorage() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  const stored = loadFromStorage()
  notebookStore.setState(() => stored ?? freshClientState())
  let raf = 0
  notebookStore.subscribe(() => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notebookStore.state))
      } catch {
        /* quota or private mode */
      }
    })
  })
}

export const actions = {
  addCell(afterId?: string, source = '') {
    notebookStore.setState((s) => {
      const idx = afterId ? s.cells.findIndex((c) => c.id === afterId) + 1 : s.cells.length
      const inserted = emptyCell(idx + 1, source)
      const next = [...s.cells]
      next.splice(idx, 0, inserted)
      return { ...s, cells: renumber(next), activeCellId: inserted.id }
    })
  },

  removeCell(id: string) {
    notebookStore.setState((s) => {
      const next = s.cells.filter((c) => c.id !== id)
      return {
        ...s,
        cells: renumber(next.length ? next : [emptyCell(1)]),
        activeCellId: s.activeCellId === id ? null : s.activeCellId,
      }
    })
  },

  updateSource(id: string, source: string) {
    notebookStore.setState((s) => ({
      ...s,
      cells: s.cells.map((c) => (c.id === id ? { ...c, source } : c)),
    }))
  },

  setActive(id: string | null) {
    notebookStore.setState((s) => ({ ...s, activeCellId: id }))
  },

  clearOutput(id: string) {
    notebookStore.setState((s) => ({
      ...s,
      cells: s.cells.map((c) =>
        c.id === id
          ? { ...c, output: [], status: 'idle', durationMs: undefined, cacheHit: undefined, exitCode: undefined }
          : c,
      ),
    }))
  },

  applyEvent(id: string, ev: EvalEvent) {
    notebookStore.setState((s) => ({
      ...s,
      cells: s.cells.map((c) => (c.id === id ? reduceCell(c, ev) : c)),
    }))
  },

  resetSession() {
    notebookStore.setState(() => initialState())
  },
}

function reduceCell(c: Cell, ev: EvalEvent): Cell {
  switch (ev.kind) {
    case 'started':
      return { ...c, status: 'compiling', startedAt: ev.startedAt, output: [] }
    case 'stdout':
      return { ...c, status: 'running', output: appendChunk(c.output, 'stdout', ev.chunk) }
    case 'stderr':
      return { ...c, status: 'running', output: appendChunk(c.output, 'stderr', ev.chunk) }
    case 'diagnostic':
      return {
        ...c,
        status: ev.level === 'error' ? 'error' : c.status,
        output: [...c.output, { stream: 'diagnostic', text: ev.message, level: ev.level }],
      }
    case 'result':
      return { ...c, output: [...c.output, { stream: 'result', text: ev.value }] }
    case 'done':
      return {
        ...c,
        status: ev.exitCode === 0 ? 'ok' : 'error',
        durationMs: ev.durationMs,
        cacheHit: ev.cacheHit,
        exitCode: ev.exitCode,
      }
    case 'error':
      return {
        ...c,
        status: 'error',
        output: [...c.output, { stream: 'system', text: ev.message }],
      }
  }
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

function renumber(cells: Cell[]): Cell[] {
  return cells.map((c, i) => ({ ...c, index: i + 1 }))
}
