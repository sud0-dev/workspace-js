import { describe, it, expect, beforeEach } from 'vitest'
import { scratchActions, scratchStore } from '../scratch'

beforeEach(() => {
  scratchActions.reset()
})

describe('scratch · structure', () => {
  it('starts with seeded source and idle status', () => {
    expect(scratchStore.state.source).toContain('fn main')
    expect(scratchStore.state.status).toBe('idle')
    expect(scratchStore.state.output).toEqual([])
  })

  it('updateSource mutates only source', () => {
    scratchActions.updateSource('let x = 1;')
    expect(scratchStore.state.source).toBe('let x = 1;')
    expect(scratchStore.state.status).toBe('idle')
  })
})

describe('scratch · reducer', () => {
  it('started → compiling, clears prior output', () => {
    scratchActions.applyEvent({ kind: 'stdout', chunk: 'old\n' })
    scratchActions.applyEvent({ kind: 'started', startedAt: 9 })
    expect(scratchStore.state.status).toBe('compiling')
    expect(scratchStore.state.output).toEqual([])
    expect(scratchStore.state.startedAt).toBe(9)
  })

  it('coalesces consecutive stdout chunks', () => {
    scratchActions.applyEvent({ kind: 'started', startedAt: 0 })
    scratchActions.applyEvent({ kind: 'stdout', chunk: 'a' })
    scratchActions.applyEvent({ kind: 'stdout', chunk: 'b\n' })
    expect(scratchStore.state.output).toEqual([{ stream: 'stdout', text: 'ab\n' }])
  })

  it('done with exit 0 → ok, captures timing + cacheHit', () => {
    scratchActions.applyEvent({
      kind: 'done',
      exitCode: 0,
      durationMs: 120,
      cacheHit: true,
    })
    expect(scratchStore.state).toMatchObject({
      status: 'ok',
      durationMs: 120,
      cacheHit: true,
      exitCode: 0,
    })
  })

  it('done with non-zero exit → error', () => {
    scratchActions.applyEvent({
      kind: 'done',
      exitCode: 1,
      durationMs: 10,
      cacheHit: false,
    })
    expect(scratchStore.state.status).toBe('error')
  })

  it('error event sets error status + system chunk', () => {
    scratchActions.applyEvent({ kind: 'error', message: 'network down' })
    expect(scratchStore.state.status).toBe('error')
    expect(scratchStore.state.output.at(-1)).toEqual({
      stream: 'system',
      text: 'network down',
    })
  })

  it('clearOutput resets status + output and drops timing', () => {
    scratchActions.applyEvent({ kind: 'started', startedAt: 1 })
    scratchActions.applyEvent({ kind: 'stdout', chunk: 'x\n' })
    scratchActions.applyEvent({ kind: 'done', exitCode: 0, durationMs: 50, cacheHit: false })
    scratchActions.clearOutput()
    expect(scratchStore.state).toMatchObject({
      status: 'idle',
      output: [],
      durationMs: undefined,
      cacheHit: undefined,
      exitCode: undefined,
    })
  })
})
