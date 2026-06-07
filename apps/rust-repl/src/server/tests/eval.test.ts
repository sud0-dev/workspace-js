import { describe, it, expect } from 'vitest'
import {
  mockEvalStream,
  fakeStdoutFor,
  sourceHash,
  type EvalInput,
} from '../eval'
import type { EvalEvent } from '#/state/notebook'

const FAST: { compileDelayMs: () => number; printDelayMs: () => number } = {
  compileDelayMs: () => 0,
  printDelayMs: () => 0,
}

const baseInput = (source: string): EvalInput => ({
  sessionId: 's_test',
  cellId: 'c_test',
  source,
})

async function collect(source: string, opts = {}): Promise<EvalEvent[]> {
  const events: EvalEvent[] = []
  for await (const ev of mockEvalStream(baseInput(source), { ...FAST, ...opts })) {
    events.push(ev)
  }
  return events
}

describe('mockEvalStream · happy path', () => {
  it('emits started → stdout → done in order', async () => {
    const evs = await collect('fn main() { println!("hi"); }', {
      forceCacheHit: false,
    })
    expect(evs[0].kind).toBe('started')
    expect(evs.at(-1)).toMatchObject({ kind: 'done', exitCode: 0, cacheHit: false })
    expect(evs.filter((e) => e.kind === 'stdout')).toHaveLength(1)
  })

  it('emits one stdout per println!', async () => {
    const src = `
      fn main() {
        println!("a");
        println!("b");
        println!("c");
      }
    `
    const evs = await collect(src, { forceCacheHit: false })
    const stdouts = evs.filter((e): e is Extract<EvalEvent, { kind: 'stdout' }> => e.kind === 'stdout')
    expect(stdouts.map((e) => e.chunk.trim())).toEqual(['a', 'b', 'c'])
  })

  it('done.durationMs is non-negative', async () => {
    const evs = await collect('println!("x");', { forceCacheHit: true })
    const done = evs.at(-1) as Extract<EvalEvent, { kind: 'done' }>
    expect(done.kind).toBe('done')
    expect(done.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('forceCacheHit=true reports cacheHit=true on done', async () => {
    const evs = await collect('println!("cached");', { forceCacheHit: true })
    expect(evs.at(-1)).toMatchObject({ kind: 'done', cacheHit: true })
  })
})

describe('mockEvalStream · failure paths', () => {
  it('panic! source short-circuits with diagnostic + exit 101', async () => {
    const evs = await collect('fn main() { panic!("boom"); }', { forceCacheHit: false })
    expect(evs.some((e) => e.kind === 'diagnostic' && e.level === 'error')).toBe(true)
    expect(evs.at(-1)).toMatchObject({ kind: 'done', exitCode: 101 })
    expect(evs.some((e) => e.kind === 'stdout')).toBe(false)
  })

  it('dangling let triggers compile-error diagnostic + exit 1', async () => {
    const src = `fn main() {\n  let x = 5\n}`
    const evs = await collect(src, { forceCacheHit: false })
    const diag = evs.find((e) => e.kind === 'diagnostic')
    expect(diag).toMatchObject({ level: 'error' })
    expect(evs.at(-1)).toMatchObject({ kind: 'done', exitCode: 1 })
  })
})

describe('fakeStdoutFor · println parsing', () => {
  it('returns a placeholder line for empty source', () => {
    expect(fakeStdoutFor('')).toEqual([
      '(no output) — your program compiled, but printed nothing.',
    ])
  })

  it('extracts plain literals', () => {
    expect(fakeStdoutFor('println!("hello")')).toEqual(['hello'])
  })

  it('substitutes positional args in order', () => {
    const out = fakeStdoutFor('println!("{}-{}", a, b)')
    expect(out).toEqual(['a-b'])
  })

  it('unescapes \\n', () => {
    expect(fakeStdoutFor('println!("a\\nb")')).toEqual(['a\nb'])
  })
})

describe('sourceHash', () => {
  it('returns identical hashes for identical input', () => {
    expect(sourceHash('fn main(){}')).toBe(sourceHash('fn main(){}'))
  })

  it('returns different hashes for different input', () => {
    expect(sourceHash('a')).not.toBe(sourceHash('b'))
  })

  it('returns hex string', () => {
    expect(sourceHash('xyz')).toMatch(/^[0-9a-f]+$/)
  })
})
