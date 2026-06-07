import { createServerFn } from '@tanstack/react-start'
import { getCrateApi, searchCratesApi, type CratesEnv } from './cratesApi'
import type { DetailResult, SearchResult } from './types'

// Reads the Worker env. Behind TanStack Start on CF, env vars live on the
// request context. For non-CF dev fallback we read from process.env so the
// rate limiter still works locally without exploding.
function getEnv(): CratesEnv {
  const procEnv = typeof process !== 'undefined' ? process.env : undefined
  const cfEnv =
    (globalThis as { __env?: CratesEnv }).__env ??
    (globalThis as { env?: CratesEnv }).env
  return {
    CRATES_CONTACT_EMAIL:
      cfEnv?.CRATES_CONTACT_EMAIL ?? procEnv?.CRATES_CONTACT_EMAIL,
    CRATES_INDEX: cfEnv?.CRATES_INDEX,
  }
}

export const searchCrates = createServerFn({ method: 'GET' })
  .validator((d: { q: string }) => d)
  .handler(async ({ data }): Promise<SearchResult> => {
    const env = getEnv()
    const { data: result, error } = await searchCratesApi(env, data.q)
    if (error || !result) {
      return { crates: [], total: 0, source: 'live' }
    }
    return result
  })

export const getCrate = createServerFn({ method: 'GET' })
  .validator((d: { name: string }) => d)
  .handler(async ({ data }): Promise<DetailResult> => {
    const env = getEnv()
    const { data: result, error } = await getCrateApi(env, data.name)
    if (error || !result) {
      return { crate: null, source: 'live', error: error ?? 'not found' }
    }
    return { crate: result.crate, source: result.source, error: null }
  })
