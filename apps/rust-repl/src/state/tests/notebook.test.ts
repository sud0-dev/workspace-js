import { describe, it, expect, beforeEach } from 'vitest'
import { actions, notebookStore, hydrateFromStorage, type EvalEvent } from '../notebook'

function reset() {
  // Force a fresh client state without going through localStorage.
  notebookStore.setState(() => ({
    sessionId: 's_test',
    cells: [
      {
        id: 'c_seed',
        index: 1,
        source: 'fn main() {}',
        status: 'idle',
        output: [],
      },
    ],
    activeCellId: null,
  }))
}

beforeEach(() => {
  window.localStorage.clear()
  reset()
})

describe('notebook · structure', () => {
  it('starts with exactly one seeded cell', () => {
    expect(notebookStore.state.cells).toHaveLength(1)
    expect(notebookStore.state.cells[0].index).toBe(1)
  })

  it('addCell appends at end when no anchor given and renumbers', () => {
    actions.addCell()
    actions.addCell()
    const cells = notebookStore.state.cells
    expect(cells).toHaveLength(3)
    expect(cells.map((c) => c.index)).toEqual([1, 2, 3])
    expect(new Set(cells.map((c) => c.id)).size).toBe(3)
  })

  it('addCell inserts right after the given anchor', () => {
    actions.addCell()
    const [first, second] = notebookStore.state.cells
    actions.addCell(first.id)
    const cells = notebookStore.state.cells
    expect(cells[0].id).toBe(first.id)
    expect(cells[2].id).toBe(second.id)
    expect(cells.map((c) => c.index)).toEqual([1, 2, 3])
  })

  it('removeCell drops it and renumbers; never drops below one cell', () => {
    actions.addCell()
    actions.addCell()
    const middle = notebookStore.state.cells[1]
    actions.removeCell(middle.id)
    expect(notebookStore.state.cells).toHaveLength(2)
    expect(notebookStore.state.cells.map((c) => c.index)).toEqual([1, 2])

    // remove all -> floor at one fresh cell
    const remaining = [...notebookStore.state.cells]
    remaining.forEach((c) => actions.removeCell(c.id))
    expect(notebookStore.state.cells).toHaveLength(1)
  })

  it('updateSource mutates only the targeted cell', () => {
    actions.addCell()
    const [a, b] = notebookStore.state.cells
    actions.updateSource(a.id, 'let x = 1;')
    expect(notebookStore.state.cells[0].source).toBe('let x = 1;')
    expect(notebookStore.state.cells[1].source).toBe(b.source)
  })
})

describe('notebook · reducer over EvalEvent', () => {
  function cellId() {
    return notebookStore.state.cells[0].id
  }

  it('started → compiling, clears prior output', () => {
    const id = cellId()
    actions.applyEvent(id, { kind: 'stdout', chunk: 'old\n' })
    actions.applyEvent(id, { kind: 'started', startedAt: 100 })
    const c = notebookStore.state.cells[0]
    expect(c.status).toBe('compiling')
    expect(c.output).toEqual([])
    expect(c.startedAt).toBe(100)
  })

  it('coalesces consecutive stdout chunks into one block', () => {
    const id = cellId()
    actions.applyEvent(id, { kind: 'started', startedAt: 0 })
    actions.applyEvent(id, { kind: 'stdout', chunk: 'hello ' })
    actions.applyEvent(id, { kind: 'stdout', chunk: 'world\n' })
    expect(notebookStore.state.cells[0].output).toEqual([
      { stream: 'stdout', text: 'hello world\n' },
    ])
  })

  it('splits when stream type changes', () => {
    const id = cellId()
    actions.applyEvent(id, { kind: 'stdout', chunk: 'ok\n' })
    actions.applyEvent(id, { kind: 'stderr', chunk: 'warn\n' })
    actions.applyEvent(id, { kind: 'stdout', chunk: 'ok2\n' })
    const o = notebookStore.state.cells[0].output
    expect(o.map((c) => c.stream)).toEqual(['stdout', 'stderr', 'stdout'])
  })

  it('diagnostic event flips status to error when level=error', () => {
    const id = cellId()
    actions.applyEvent(id, {
      kind: 'diagnostic',
      level: 'error',
      message: 'E0001',
    })
    expect(notebookStore.state.cells[0].status).toBe('error')
    expect(notebookStore.state.cells[0].output[0]).toMatchObject({
      stream: 'diagnostic',
      level: 'error',
    })
  })

  it('diagnostic warning does not change status', () => {
    const id = cellId()
    actions.applyEvent(id, { kind: 'started', startedAt: 0 })
    actions.applyEvent(id, {
      kind: 'diagnostic',
      level: 'warning',
      message: 'unused var',
    })
    expect(notebookStore.state.cells[0].status).toBe('compiling')
  })

  it('done sets ok/error based on exit code and stores timing+cache', () => {
    const id = cellId()
    actions.applyEvent(id, {
      kind: 'done',
      exitCode: 0,
      durationMs: 320,
      cacheHit: true,
    })
    expect(notebookStore.state.cells[0]).toMatchObject({
      status: 'ok',
      durationMs: 320,
      cacheHit: true,
      exitCode: 0,
    })

    const id2 = cellId()
    actions.applyEvent(id2, {
      kind: 'done',
      exitCode: 101,
      durationMs: 50,
      cacheHit: false,
    })
    expect(notebookStore.state.cells[0].status).toBe('error')
  })

  it('error event appends system chunk and sets error status', () => {
    const id = cellId()
    actions.applyEvent(id, { kind: 'error', message: 'network down' })
    const c = notebookStore.state.cells[0]
    expect(c.status).toBe('error')
    expect(c.output.at(-1)).toEqual({ stream: 'system', text: 'network down' })
  })

  it('clearOutput resets status + output and drops timing', () => {
    const id = cellId()
    const events: EvalEvent[] = [
      { kind: 'started', startedAt: 0 },
      { kind: 'stdout', chunk: 'x\n' },
      { kind: 'done', exitCode: 0, durationMs: 50, cacheHit: false },
    ]
    for (const ev of events) actions.applyEvent(id, ev)
    actions.clearOutput(id)
    expect(notebookStore.state.cells[0]).toMatchObject({
      status: 'idle',
      output: [],
      durationMs: undefined,
      cacheHit: undefined,
      exitCode: undefined,
    })
  })
})

describe('notebook · hydration', () => {
  it('hydrateFromStorage replaces SSR placeholder with a fresh session', () => {
    notebookStore.setState(() => ({
      sessionId: 's_ssr',
      cells: [{ id: 'c_ssr', index: 1, source: '', status: 'idle', output: [] }],
      activeCellId: null,
    }))
    hydrateFromStorage()
    expect(notebookStore.state.sessionId).not.toBe('s_ssr')
    expect(notebookStore.state.cells[0].id).not.toBe('c_ssr')
  })

  it('hydrateFromStorage is idempotent', () => {
    hydrateFromStorage()
    const sid = notebookStore.state.sessionId
    hydrateFromStorage()
    expect(notebookStore.state.sessionId).toBe(sid)
  })
})
