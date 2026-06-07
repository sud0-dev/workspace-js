import { clearCache } from './cache'

declare const __FOUNDRY_BUILD_ID__: string

const STORAGE_BUILD_KEY = 'foundry:build'
const KEYS_TO_WIPE = ['foundry:notebook:v1', 'foundry:scratch:v1']

export function getBuildId(): string {
  try {
    return __FOUNDRY_BUILD_ID__
  } catch {
    return 'dev'
  }
}

// Hard-reset notebook + scratch + cache when the build changes. No-op in dev.
let ran = false
export function runBuildGate() {
  if (ran || typeof window === 'undefined') return
  ran = true
  const id = getBuildId()
  if (id === 'dev') return
  const stored = window.localStorage.getItem(STORAGE_BUILD_KEY)
  if (stored === id) return
  for (const k of KEYS_TO_WIPE) {
    try { window.localStorage.removeItem(k) } catch { /* quota */ }
  }
  void clearCache().catch(() => {})
  try { window.localStorage.setItem(STORAGE_BUILD_KEY, id) } catch { /* quota */ }
}
