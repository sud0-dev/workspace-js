import { evalCell, sourceHash } from '#/server/eval'
import { actions, type EvalEvent } from '#/state/notebook'
import { scratchActions } from '#/state/scratch'
import { getCached, setCached } from './cache'

type RunOptions = {
  sessionId: string
  key: string                          // cellId for notebook; constant for scratch
  source: string
  apply: (ev: EvalEvent) => void
  clear: () => void
}

const inflight = new Map<string, AbortController>()
const SCRATCH_KEY = '__scratch__'

async function streamEval(opts: RunOptions) {
  cancelKey(opts.key)
  const ac = new AbortController()
  inflight.set(opts.key, ac)

  opts.clear()

  try {
    const hash = sourceHash(opts.source)
    const hit = await getCached(hash)
    if (hit) {
      replay(hit.events, opts.apply, ac.signal)
      return
    }

    const stream = (await evalCell({
      data: { sessionId: opts.sessionId, cellId: opts.key, source: opts.source },
      signal: ac.signal,
    })) as AsyncIterable<EvalEvent>

    const captured: EvalEvent[] = []
    let exitCode: number | null = null
    let sawError = false

    for await (const ev of stream) {
      if (ac.signal.aborted) break
      opts.apply(ev)
      captured.push(ev)
      if (ev.kind === 'error') sawError = true
      if (ev.kind === 'done') exitCode = ev.exitCode
    }

    if (!sawError && !ac.signal.aborted && exitCode != null) {
      void setCached(hash, captured, exitCode)
    }
  } catch (err) {
    if (ac.signal.aborted) {
      opts.apply({ kind: 'error', message: '— stopped —' })
      return
    }
    const message = err instanceof Error ? err.message : 'unknown error'
    opts.apply({ kind: 'error', message })
  } finally {
    inflight.delete(opts.key)
  }
}

function replay(events: EvalEvent[], apply: (ev: EvalEvent) => void, signal: AbortSignal) {
  apply({ kind: 'started', startedAt: Date.now() })
  for (const ev of events) {
    if (signal.aborted) return
    if (ev.kind === 'started') continue
    if (ev.kind === 'done') {
      apply({ kind: 'done', exitCode: ev.exitCode, durationMs: 0, cacheHit: true })
      continue
    }
    apply(ev)
  }
}

// Notebook entry point.
export function runCell(opts: { sessionId: string; cellId: string; source: string }) {
  return streamEval({
    sessionId: opts.sessionId,
    key: opts.cellId,
    source: opts.source,
    apply: (ev) => actions.applyEvent(opts.cellId, ev),
    clear: () => actions.clearOutput(opts.cellId),
  })
}

// Single-file entry point.
export function runScratch(opts: { sessionId: string; source: string }) {
  return streamEval({
    sessionId: opts.sessionId,
    key: SCRATCH_KEY,
    source: opts.source,
    apply: scratchActions.applyEvent,
    clear: scratchActions.clearOutput,
  })
}

export function cancelCell(cellId: string) {
  cancelKey(cellId)
}

export function cancelScratch() {
  cancelKey(SCRATCH_KEY)
}

function cancelKey(key: string) {
  const ac = inflight.get(key)
  if (ac) ac.abort()
  inflight.delete(key)
}

export function isRunning(key: string) {
  return inflight.has(key)
}
