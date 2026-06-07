// ── Daily snapshot refresh ──────────────────────────────────────────────────
//
// Cron schedule lives in wrangler.toml: `crons = ["0 4 * * *"]` (04:00 UTC).
// Cloudflare invokes this with a `scheduled` event.
//
// PHASE 2B STATUS: stub. This file documents the pipeline; the heavy lift
// (stream-decompress a 250 MB tar.gz inside a Worker's 128 MB heap) needs a
// careful implementation and is intentionally not wired into the runtime yet.
//
// ── Pipeline ────────────────────────────────────────────────────────────────
//
// 1. Fetch https://static.crates.io/db-dump.tar.gz
//    - Streamed, gzip-decoded via DecompressionStream("gzip")
//    - Static endpoint, not subject to API rate limit
//
// 2. Tar-parse only the files we need (drop everything else):
//    - data/crates.csv         crate metadata (name, description, …)
//    - data/versions.csv       version list per crate
//    - data/dependencies.csv   inter-crate deps
//    Skip the heavy ones: download_stats, version_authors, etc.
//
// 3. For each crate, assemble a slim CrateDetail JSON and write to KV:
//    - key: `crate:${name}`
//    - value: JSON, < 25 KB per crate (KV value limit is 25 MB but we want
//      cheap point reads, so keep entries tiny)
//
// 4. Also build a search index for popular prefixes:
//    - key: `search:${term}` for common 1-3 char prefixes / popular names
//    - value: array of CrateSummary (top 20 matches)
//
// 5. Track progress + last-success in KV under `meta:lastDump` so we can show
//    a "data snapshot from <date>" banner in the UI.
//
// ── Memory strategy ─────────────────────────────────────────────────────────
// The Worker has 128 MB heap. The compressed dump is ~250 MB; uncompressed
// CSVs we want are ~3.5 MB. We must NEVER buffer the full archive. Use:
//   - response.body → DecompressionStream → custom tar-parser (streaming)
//   - Yield CSV chunks as they arrive
//   - Write to KV in batches with rate limiting (KV write is ~1 op/sec/key)
// Recommended tar parser: `@gera2ld/tarjs` or a hand-rolled 512-byte block
// reader (~150 LoC). Avoid pulling Node-only `tar` package.
//
// ── Why we don't try this synchronously yet ─────────────────────────────────
// Even with streaming, parsing + KV writes for ~150k crates takes minutes.
// Workers Cron has a 30s wall-clock limit by default. The right path:
//   - Use Workers Queues to chunk the job (one queue message per N crates)
//   - OR a one-shot scheduled R2 download + R2-Workers-Bindings indexing
//   - OR run the indexer outside CF and PUT into KV via the REST API
// Picking the right approach is a separate decision worth its own pass.

export type ScheduledController = {
  scheduledTime: number
  cron: string
  noRetry?: () => void
}

export type Env = {
  CRATES_INDEX?: {
    put: (key: string, value: string, opts?: { expirationTtl?: number }) => Promise<void>
    get: (key: string, type?: 'text' | 'json') => Promise<unknown>
  }
}

export async function scheduled(
  _event: ScheduledController,
  _env: Env,
  _ctx: { waitUntil: (p: Promise<unknown>) => void },
): Promise<void> {
  // TODO: pipeline per the doc above. Until then we just stamp a heartbeat
  // so we can confirm the cron is firing once it's deployed.
  try {
    if (_env.CRATES_INDEX) {
      await _env.CRATES_INDEX.put(
        'meta:lastCronTick',
        JSON.stringify({ at: new Date().toISOString(), status: 'stub' }),
      )
    }
  } catch {
    // KV unavailable in dev — fine.
  }
}
