import { createServerFn } from '@tanstack/react-start'
import type { EvalEvent } from '#/state/notebook'

export type EvalInput = {
  sessionId: string
  cellId: string
  source: string
}

export type MockOpts = {
  // override the compile delay range — useful in tests
  compileDelayMs?: () => number
  // override per-line print delay — useful in tests
  printDelayMs?: () => number
  // force cache-hit decision — useful in tests
  forceCacheHit?: boolean
}

export type PlaygroundResult = {
  success: boolean
  stdout: string
  stderr: string
  exitDetail?: string
}

export type PlaygroundOpts = {
  // override the upstream URL — useful in tests
  url?: string
  // pre-supplied fetch — useful in tests
  fetchImpl?: typeof fetch
  // override timeout
  timeoutMs?: number
}

enum Channel { STABLE = 'stable', BETA = 'beta', NIGHTLY = 'nightly' }
enum Mode { DEBUG = 'debug', RELEASE = 'release' }
enum Edition { E2021 = '2021', E2024 = '2024' }
enum CrateType { BIN = 'bin', LIB = 'lib' }

const DEFAULT_PLAYGROUND_URL = 'https://play.rust-lang.org/execute'

function resolvePlaygroundUrl(): string {
  // Server-side env at call time; never read at module load (CF Workers don't expose
  // process.env at module scope, and we want runtime-resolvable config).
  const fromEnv =
    (typeof process !== 'undefined' && process.env?.FOUNDRY_COMPILE_URL) ||
    (globalThis as { FOUNDRY_COMPILE_URL?: string }).FOUNDRY_COMPILE_URL
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_PLAYGROUND_URL
}
const FETCH_TIMEOUT_MS = 15_000
const MAX_SOURCE_BYTES = 64 * 1024

const COMPILE_MIN_MS = 220
const COMPILE_MAX_MS = 680
const PRINT_LINE_MS = 80

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function sourceHash(s: string) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return (h >>> 0).toString(16)
}

// Stand-in until WASM-in-browser execution lands: pulls println! literals out of source.
export function fakeStdoutFor(source: string): string[] {
  const out: string[] = []
  const re = /println!\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*(?:,([^)]*))?\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    const fmt = m[1].replace(/\\n/g, '\n')
    const args = (m[2] ?? '')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)
    let i = 0
    const filled = fmt.replace(/\{[^}]*\}/g, () => args[i++] ?? '?')
    out.push(filled)
  }
  if (out.length === 0) {
    out.push('(no output) — your program compiled, but printed nothing.')
  }
  return out
}

function rand(a: number, b: number) {
  return a + Math.floor(Math.random() * (b - a))
}

// Call the public Rust Playground sandbox. Server-side only — no CORS.
async function callPlayground(
  source: string,
  opts: PlaygroundOpts,
): Promise<{ data: PlaygroundResult | null; error: string | null }> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const url = opts.url ?? resolvePlaygroundUrl()
  const timeout = opts.timeoutMs ?? FETCH_TIMEOUT_MS

  if (new TextEncoder().encode(source).byteLength > MAX_SOURCE_BYTES) {
    return { data: null, error: `source exceeds ${MAX_SOURCE_BYTES} byte cap` }
  }

  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        channel: Channel.STABLE,
        mode: Mode.DEBUG,
        edition: Edition.E2021,
        crateType: CrateType.BIN,
        tests: false,
        code: source,
        backtrace: false,
      }),
      signal: AbortSignal.timeout(timeout),
    })
    if (!res.ok) {
      return { data: null, error: `play.rust-lang.org returned ${res.status}` }
    }
    const json = (await res.json()) as PlaygroundResult
    return { data: json, error: null }
  } catch (e) {
    const err = e as { name?: string; message?: string }
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return { data: null, error: `timeout after ${timeout}ms` }
    }
    return { data: null, error: err?.message ?? 'unknown' }
  }
}

// Real path: stream events around a one-shot Playground response.
export async function* playgroundEvalStream(
  data: EvalInput,
  opts: PlaygroundOpts = {},
): AsyncGenerator<EvalEvent> {
  const startedAt = Date.now()
  yield { kind: 'started', startedAt }

  const { data: result, error } = await callPlayground(data.source, opts)

  if (error || !result) {
    yield { kind: 'error', message: error ?? 'no response' }
    yield {
      kind: 'done',
      exitCode: -1,
      durationMs: Date.now() - startedAt,
      cacheHit: false,
    }
    return
  }

  // stderr from playground bundles compile output + runtime stderr.
  if (result.stderr) {
    yield { kind: 'stderr', chunk: result.stderr }
  }
  if (result.stdout) {
    yield { kind: 'stdout', chunk: result.stdout }
  }

  const exitMatch = result.exitDetail?.match(/status (\d+)/i)
  const exitCode = exitMatch ? Number(exitMatch[1]) : result.success ? 0 : 1

  yield {
    kind: 'done',
    exitCode,
    durationMs: Date.now() - startedAt,
    cacheHit: false,
  }
}

// Kept for tests + offline dev.
export async function* mockEvalStream(
  data: EvalInput,
  opts: MockOpts = {},
): AsyncGenerator<EvalEvent> {
  const startedAt = Date.now()
  const cacheHit =
    opts.forceCacheHit ?? (data.source.length > 0 && Math.random() < 0.18)

  yield { kind: 'started', startedAt }

  const compileDelay = opts.compileDelayMs?.() ?? rand(COMPILE_MIN_MS, COMPILE_MAX_MS)
  await sleep(cacheHit ? 0 : compileDelay)

  if (data.source.includes('panic!')) {
    yield {
      kind: 'diagnostic',
      level: 'error',
      message: `thread 'main' panicked at src/main.rs:1:5\nexplicit panic — \`panic!()\` was invoked from your snippet.`,
    }
    yield {
      kind: 'done',
      exitCode: 101,
      durationMs: Date.now() - startedAt,
      cacheHit,
    }
    return
  }

  const lastLines = data.source.split('\n').slice(-3).join('\n')
  if (/[^a-zA-Z_]let\s+\w+\s*=\s*[^;]*$/m.test(lastLines)) {
    yield {
      kind: 'diagnostic',
      level: 'error',
      message: `error: expected \`;\`, found end of macro arguments\n --> src/main.rs:${(data.source.match(/\n/g)?.length ?? 0) + 1}:1`,
    }
    yield {
      kind: 'done',
      exitCode: 1,
      durationMs: Date.now() - startedAt,
      cacheHit,
    }
    return
  }

  for (const line of fakeStdoutFor(data.source)) {
    yield { kind: 'stdout', chunk: line + '\n' }
    const d = opts.printDelayMs?.() ?? rand(PRINT_LINE_MS, PRINT_LINE_MS * 2)
    await sleep(d)
  }

  yield {
    kind: 'done',
    exitCode: 0,
    durationMs: Date.now() - startedAt,
    cacheHit,
  }
}

export const evalCell = createServerFn({ method: 'POST' })
  .validator((d: EvalInput) => d)
  .handler(async function* ({ data }) {
    yield* playgroundEvalStream(data)
  })
