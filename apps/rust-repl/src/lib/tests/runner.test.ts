import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { EvalEvent } from '#/state/notebook'

// Mock the server function and the cache before importing the SUT.
vi.mock('#/server/eval', () => ({
  evalCell: vi.fn(),
  sourceHash: (s: string) => s,
}))

vi.mock('../cache', () => ({
  getCached: vi.fn().mockResolvedValue(null),
  setCached: vi.fn().mockResolvedValue(undefined),
}))

import { evalCell } from '#/server/eval'
import { getCached } from '../cache'
import { runCell, cancelCell, isRunning } from '../runner'
import { actions, notebookStore } from '#/state/notebook'

const mockedEval = vi.mocked(evalCell)
const mockedGetCached = vi.mocked(getCached)

function fixtureCell() {
  notebookStore.setState(() => ({
    sessionId: 's_test',
    cells: [
      { id: 'c_run', index: 1, source: 'fn main(){}', status: 'idle', output: [] },
    ],
    activeCellId: null,
  }))
}

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/**
 * Build an async iterable that yields events one at a time, gated on a queue
 * the test controls. Lets us assert state mid-stream and trigger abort
 * deterministically.
 */
function controllableStream() {
  const queue: Array<{ value?: EvalEvent; done?: boolean }> = []
  const waiters: Array<(v: void) => void> = []
  function push(item: { value?: EvalEvent; done?: boolean }) {
    queue.push(item)
    const w = waiters.shift()
    if (w) w()
  }
  const iterable: AsyncIterable<EvalEvent> = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          while (queue.length === 0) {
            await new Promise<void>((r) => waiters.push(r))
          }
          const item = queue.shift()!
          if (item.done) return { value: undefined as unknown as EvalEvent, done: true }
          return { value: item.value!, done: false }
        },
      }
    },
  }
  return {
    iterable,
    emit: (ev: EvalEvent) => push({ value: ev }),
    close: () => push({ done: true }),
  }
}

beforeEach(() => {
  fixtureCell()
  mockedEval.mockReset()
  mockedGetCached.mockReset()
  mockedGetCached.mockResolvedValue(null)
})

describe('runner · happy path', () => {
  it('applies events from the stream into the store', async () => {
    const stream = controllableStream()
    mockedEval.mockResolvedValue(stream.iterable as never)

    const run = runCell({ sessionId: 's_test', cellId: 'c_run', source: 'src' })

    stream.emit({ kind: 'started', startedAt: 1 })
    await Promise.resolve()
    stream.emit({ kind: 'stdout', chunk: 'hello\n' })
    stream.emit({ kind: 'done', exitCode: 0, durationMs: 5, cacheHit: false })
    stream.close()

    await run

    const cell = notebookStore.state.cells[0]
    expect(cell.status).toBe('ok')
    expect(cell.output).toEqual([{ stream: 'stdout', text: 'hello\n' }])
    expect(cell.exitCode).toBe(0)
  })

  it('calls evalCell with the right payload', async () => {
    const stream = controllableStream()
    mockedEval.mockResolvedValue(stream.iterable as never)
    const run = runCell({ sessionId: 's_test', cellId: 'c_run', source: 'fn x(){}' })
    stream.emit({ kind: 'done', exitCode: 0, durationMs: 1, cacheHit: false })
    stream.close()
    await run
    expect(mockedEval).toHaveBeenCalledTimes(1)
    const arg = mockedEval.mock.calls[0][0] as { data: unknown; signal: AbortSignal }
    expect(arg.data).toEqual({ sessionId: 's_test', cellId: 'c_run', source: 'fn x(){}' })
    expect(arg.signal).toBeInstanceOf(AbortSignal)
  })
})

describe('runner · abort', () => {
  it('cancelCell aborts the in-flight run mid-stream', async () => {
    const stream = controllableStream()
    mockedEval.mockResolvedValue(stream.iterable as never)

    const run = runCell({ sessionId: 's_test', cellId: 'c_run', source: 's' })

    stream.emit({ kind: 'started', startedAt: 1 })
    await Promise.resolve()
    stream.emit({ kind: 'stdout', chunk: 'part 1\n' })
    await Promise.resolve()

    expect(isRunning('c_run')).toBe(true)
    cancelCell('c_run')
    expect(isRunning('c_run')).toBe(false)

    // late event must NOT land in the store
    stream.emit({ kind: 'stdout', chunk: 'too late\n' })
    stream.close()
    await run

    const outputs = notebookStore.state.cells[0].output
    expect(outputs.find((c) => c.text.includes('too late'))).toBeUndefined()
  })

  it('starting a second run on the same cell cancels the first', async () => {
    const a = controllableStream()
    const b = controllableStream()
    mockedEval.mockResolvedValueOnce(a.iterable as never)
    mockedEval.mockResolvedValueOnce(b.iterable as never)

    const first = runCell({ sessionId: 's_test', cellId: 'c_run', source: '1' })
    a.emit({ kind: 'started', startedAt: 1 })
    await Promise.resolve()

    const second = runCell({ sessionId: 's_test', cellId: 'c_run', source: '2' })
    a.emit({ kind: 'stdout', chunk: 'A\n' })
    a.close()

    b.emit({ kind: 'started', startedAt: 2 })
    b.emit({ kind: 'stdout', chunk: 'B\n' })
    b.emit({ kind: 'done', exitCode: 0, durationMs: 1, cacheHit: false })
    b.close()

    await Promise.all([first, second])

    const out = notebookStore.state.cells[0].output
    expect(out.find((c) => c.text.includes('A'))).toBeUndefined()
    expect(out.find((c) => c.text.includes('B'))).toBeDefined()
  })
})

describe('runner · failure', () => {
  it('rejects with an Error → records system chunk + error status', async () => {
    const failure = deferred<AsyncIterable<EvalEvent>>()
    mockedEval.mockReturnValue(failure.promise as never)

    const run = runCell({ sessionId: 's_test', cellId: 'c_run', source: 's' })
    failure.reject(new Error('network down'))

    await run
    const cell = notebookStore.state.cells[0]
    expect(cell.status).toBe('error')
    expect(cell.output.at(-1)).toEqual({ stream: 'system', text: 'network down' })
  })

  it('completes cleanly when stream closes without events', async () => {
    const stream = controllableStream()
    mockedEval.mockResolvedValue(stream.iterable as never)
    const run = runCell({ sessionId: 's_test', cellId: 'c_run', source: 's' })
    stream.close()
    await run
    expect(isRunning('c_run')).toBe(false)
  })
})

describe('runner · cache', () => {
  it('hits cache → replays events, never calls evalCell', async () => {
    mockedGetCached.mockResolvedValueOnce({
      hash: 's',
      exitCode: 0,
      storedAt: 0,
      lastAccessed: 0,
      events: [
        { kind: 'started', startedAt: 0 },
        { kind: 'stdout', chunk: 'from cache\n' },
        { kind: 'done', exitCode: 0, durationMs: 42, cacheHit: false },
      ],
    })

    await runCell({ sessionId: 's_test', cellId: 'c_run', source: 's' })

    expect(mockedEval).not.toHaveBeenCalled()
    const cell = notebookStore.state.cells[0]
    expect(cell.status).toBe('ok')
    expect(cell.cacheHit).toBe(true)
    expect(cell.durationMs).toBe(0)
    expect(cell.output).toEqual([{ stream: 'stdout', text: 'from cache\n' }])
  })
})

// Quiet TS — actions kept import-side-effect free.
void actions
