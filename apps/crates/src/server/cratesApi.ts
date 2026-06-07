// Thin wrapper around the public crates.io REST API.
// ────────────────────────────────────────────────────────────────────────────
// Contract: every entry-point returns { data, error }; never throws past the
// boundary. Real fetches are rate-limited and identified. Workers Cache absorbs
// repeat reads. KV snapshot is the degradation fallback (phase 2b).

import type { CrateDetail, CrateSummary, Dep, Feature } from './types'

const API_BASE = 'https://crates.io/api/v1'

// ── User-Agent ──────────────────────────────────────────────────────────────
// crates.io explicitly asks for a descriptive UA with contact info, so they
// can reach us rather than block us. Contact email is a wrangler secret
// (CRATES_CONTACT_EMAIL) — bunx wrangler secret put CRATES_CONTACT_EMAIL.
function userAgent(env: CratesEnv): string {
  const contact = env.CRATES_CONTACT_EMAIL || 'support@sud0.dev'
  return `crates.sud0.dev/0.1 (${contact})`
}

// ── Rate limiter ────────────────────────────────────────────────────────────
// Per-isolate token bucket targeting ≤1 req/sec aggregate to the upstream.
// Not perfect across all CF edge isolates, but Workers Cache absorbs most
// repeat reads so we comfortably stay under the limit in aggregate.
const BUCKET = { tokens: 1, last: Date.now() }
const RATE_PER_SEC = 1

async function awaitToken(): Promise<void> {
  while (true) {
    const now = Date.now()
    const elapsed = (now - BUCKET.last) / 1000
    BUCKET.tokens = Math.min(1, BUCKET.tokens + elapsed * RATE_PER_SEC)
    BUCKET.last = now
    if (BUCKET.tokens >= 1) {
      BUCKET.tokens -= 1
      return
    }
    const waitMs = Math.ceil((1 - BUCKET.tokens) * 1000)
    await new Promise((r) => setTimeout(r, waitMs))
  }
}

// ── Workers Cache wrapper ───────────────────────────────────────────────────
async function cachedFetch(
  url: string,
  init: RequestInit,
  ttlSeconds: number,
): Promise<Response> {
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default
  const cacheKey = new Request(url, { method: 'GET' })

  if (cache) {
    const hit = await cache.match(cacheKey)
    if (hit) return hit
  }

  await awaitToken()
  const res = await fetch(url, init)

  if (cache && res.ok) {
    const cacheable = new Response(res.clone().body, res)
    cacheable.headers.set('cache-control', `public, max-age=${ttlSeconds}`)
    await cache.put(cacheKey, cacheable)
  }

  return res
}

// ── Snapshot fallback (phase 2b will populate the KV) ───────────────────────
async function snapshotCrate(env: CratesEnv, name: string): Promise<CrateDetail | null> {
  if (!env.CRATES_INDEX) return null
  try {
    const raw = await env.CRATES_INDEX.get(`crate:${name}`, 'json')
    return (raw as CrateDetail | null) ?? null
  } catch {
    return null
  }
}

async function snapshotSearch(env: CratesEnv, q: string): Promise<CrateSummary[] | null> {
  if (!env.CRATES_INDEX) return null
  try {
    const raw = await env.CRATES_INDEX.get(`search:${q.toLowerCase()}`, 'json')
    return (raw as CrateSummary[] | null) ?? null
  } catch {
    return null
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function searchCratesApi(
  env: CratesEnv,
  query: string,
): Promise<{ data: { crates: CrateSummary[]; total: number; source: 'live' | 'snapshot' } | null; error: string | null }> {
  const q = query.trim().slice(0, 80)
  if (q.length === 0) return { data: { crates: [], total: 0, source: 'live' }, error: null }

  const url = `${API_BASE}/crates?q=${encodeURIComponent(q)}&per_page=20&sort=relevance`
  try {
    const res = await cachedFetch(
      url,
      { headers: { 'user-agent': userAgent(env), accept: 'application/json' } },
      60 * 5,
    )
    if (!res.ok) {
      const fallback = await snapshotSearch(env, q)
      if (fallback) return { data: { crates: fallback, total: fallback.length, source: 'snapshot' }, error: null }
      return { data: null, error: `crates.io returned ${res.status}` }
    }
    const json = (await res.json()) as {
      crates: Array<{
        name: string
        description: string | null
        max_version: string
        downloads: number
        recent_downloads: number
        updated_at: string
      }>
      meta: { total: number }
    }
    const crates: CrateSummary[] = json.crates.map((c) => ({
      name: c.name,
      description: c.description,
      maxVersion: c.max_version,
      downloads: c.downloads,
      recentDownloads: c.recent_downloads,
      updatedAt: c.updated_at,
    }))
    return { data: { crates, total: json.meta.total, source: 'live' }, error: null }
  } catch (e) {
    const fallback = await snapshotSearch(env, q)
    if (fallback) return { data: { crates: fallback, total: fallback.length, source: 'snapshot' }, error: null }
    return { data: null, error: e instanceof Error ? e.message : 'unknown' }
  }
}

export async function getCrateApi(
  env: CratesEnv,
  name: string,
): Promise<{ data: { crate: CrateDetail; source: 'live' | 'snapshot' } | null; error: string | null }> {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
  if (safeName.length === 0) return { data: null, error: 'invalid crate name' }

  const url = `${API_BASE}/crates/${encodeURIComponent(safeName)}`
  try {
    const res = await cachedFetch(
      url,
      { headers: { 'user-agent': userAgent(env), accept: 'application/json' } },
      60 * 60,
    )

    if (!res.ok) {
      if (res.status === 404) return { data: null, error: 'not found' }
      const fallback = await snapshotCrate(env, safeName)
      if (fallback) return { data: { crate: fallback, source: 'snapshot' }, error: null }
      return { data: null, error: `crates.io returned ${res.status}` }
    }

    const json = (await res.json()) as RawCrateResponse
    const crate = normalizeCrate(json)
    return { data: { crate, source: 'live' }, error: null }
  } catch (e) {
    const fallback = await snapshotCrate(env, safeName)
    if (fallback) return { data: { crate: fallback, source: 'snapshot' }, error: null }
    return { data: null, error: e instanceof Error ? e.message : 'unknown' }
  }
}

// ── Normalizer ──────────────────────────────────────────────────────────────

type RawCrateResponse = {
  crate: {
    name: string
    description: string | null
    max_version: string
    downloads: number
    recent_downloads: number
    updated_at: string
    homepage: string | null
    repository: string | null
    documentation: string | null
    versions: number[]
  }
  versions: Array<{
    num: string
    license: string | null
    rust_version: string | null
    features?: Record<string, string[]>
    readme_path?: string | null
  }>
  keywords?: { keyword: string }[]
}

function normalizeCrate(raw: RawCrateResponse): CrateDetail {
  const latest = raw.versions[0]
  return {
    name: raw.crate.name,
    description: raw.crate.description,
    maxVersion: raw.crate.max_version,
    downloads: raw.crate.downloads,
    recentDownloads: raw.crate.recent_downloads,
    updatedAt: raw.crate.updated_at,
    homepage: raw.crate.homepage,
    repository: raw.crate.repository,
    documentation: raw.crate.documentation,
    license: latest?.license ?? null,
    msrv: latest?.rust_version ?? null,
    versions: raw.versions.map((v) => v.num).slice(0, 10),
    dependencies: [], // populated by /versions/<num>/dependencies endpoint in phase 2b
    features: extractFeatures(latest?.features),
    readme: null, // populated by /versions/<num>/readme endpoint in phase 2b
  }
}

function extractFeatures(f?: Record<string, string[]>): Feature[] {
  if (!f) return []
  return Object.entries(f)
    .slice(0, 20)
    .map(([name, deps]) => ({ name, deps }))
}

// Re-export for clarity in callers.
export type { Dep, Feature }

// ── Env binding type ────────────────────────────────────────────────────────
// Worker env. CRATES_CONTACT_EMAIL is set via wrangler secret. CRATES_INDEX
// is a KV namespace bound in wrangler.toml (phase 2b populates it).
export type CratesEnv = {
  CRATES_CONTACT_EMAIL?: string
  CRATES_INDEX?: {
    get: (key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream') => Promise<unknown>
    put: (key: string, value: string, opts?: { expirationTtl?: number }) => Promise<void>
  }
}
