import { describe, it, expect, vi } from 'vitest'
import { playgroundEvalStream, type EvalInput, type PlaygroundResult } from '../eval'
import type { EvalEvent } from '#/state/notebook'

const baseInput = (source: string): EvalInput => ({
  sessionId: 's_test',
  cellId: 'c_test',
  source,
})

function jsonResponse(body: PlaygroundResult, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

async function collect(
  source: string,
  fetchImpl: typeof fetch,
): Promise<EvalEvent[]> {
  const events: EvalEvent[] = []
  for await (const ev of playgroundEvalStream(baseInput(source), { fetchImpl })) {
    events.push(ev)
  }
  return events
}

describe('playgroundEvalStream · happy path', () => {
  it('emits started → stdout → done for successful run', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        stdout: 'hello\n',
        stderr: '   Compiling playground v0.0.1\n',
        exitDetail: 'Exited with status 0',
      }),
    ) as unknown as typeof fetch

    const evs = await collect('fn main(){ println!("hi"); }', fetchImpl)

    expect(evs[0]).toMatchObject({ kind: 'started' })
    expect(evs.find((e) => e.kind === 'stderr')).toMatchObject({
      kind: 'stderr',
      chunk: expect.stringContaining('Compiling'),
    })
    expect(evs.find((e) => e.kind === 'stdout')).toMatchObject({
      kind: 'stdout',
      chunk: 'hello\n',
    })
    expect(evs.at(-1)).toMatchObject({ kind: 'done', exitCode: 0 })
  })

  it('sends the playground request shape upstream', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ success: true, stdout: '', stderr: '', exitDetail: 'Exited with status 0' }),
    ) as unknown as typeof fetch

    await collect('fn main(){}', fetchImpl)

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const call = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    const url = call[0] as string
    const init = call[1] as RequestInit
    expect(url).toBe('https://play.rust-lang.org/execute')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({
      channel: 'stable',
      mode: 'debug',
      edition: '2021',
      crateType: 'bin',
      tests: false,
      code: 'fn main(){}',
    })
  })
})

describe('playgroundEvalStream · failure', () => {
  it('compile failure → stderr + non-zero exit', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        success: false,
        stdout: '',
        stderr: 'error[E0425]: cannot find value `undefined` in this scope\n',
        exitDetail: 'Exited with status 1',
      }),
    ) as unknown as typeof fetch

    const evs = await collect('fn main(){ undefined }', fetchImpl)
    expect(evs.find((e) => e.kind === 'stderr')).toBeDefined()
    expect(evs.at(-1)).toMatchObject({ kind: 'done', exitCode: 1 })
  })

  it('HTTP error from upstream → error event', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('rate limited', { status: 429 }),
    ) as unknown as typeof fetch

    const evs = await collect('fn main(){}', fetchImpl)
    const err = evs.find((e) => e.kind === 'error')
    expect(err).toMatchObject({ kind: 'error', message: expect.stringContaining('429') })
    expect(evs.at(-1)).toMatchObject({ kind: 'done', exitCode: -1 })
  })

  it('network failure → error event with message', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(
      new Error('fetch failed: ECONNREFUSED'),
    ) as unknown as typeof fetch

    const evs = await collect('fn main(){}', fetchImpl)
    expect(evs.find((e) => e.kind === 'error')).toMatchObject({
      kind: 'error',
      message: expect.stringContaining('ECONNREFUSED'),
    })
  })

  it('source larger than cap → error event, no fetch call', async () => {
    const huge = 'x'.repeat(65 * 1024)
    const fetchImpl = vi.fn() as unknown as typeof fetch
    const evs = await collect(huge, fetchImpl)

    expect(fetchImpl).not.toHaveBeenCalled()
    expect(evs.find((e) => e.kind === 'error')).toMatchObject({
      kind: 'error',
      message: expect.stringContaining('cap'),
    })
    expect(evs.at(-1)).toMatchObject({ kind: 'done', exitCode: -1 })
  })
})
