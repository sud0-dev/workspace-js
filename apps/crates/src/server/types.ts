// Subset of the crates.io API response shapes we actually consume.
// Keep this narrow — fewer surprises when fields are missing.

export type CrateSummary = {
  name: string
  description: string | null
  maxVersion: string
  downloads: number
  recentDownloads: number
  updatedAt: string
}

export type CrateDetail = CrateSummary & {
  homepage: string | null
  repository: string | null
  documentation: string | null
  license: string | null
  msrv: string | null
  versions: string[]
  dependencies: Dep[]
  features: Feature[]
  readme: string | null
}

export type Dep = {
  name: string
  req: string
  kind: 'normal' | 'dev' | 'build'
  optional: boolean
}

export type Feature = {
  name: string
  deps: string[]
}

export type SearchResult = {
  crates: CrateSummary[]
  total: number
  source: 'live' | 'snapshot' | 'mock'
}

export type DetailResult = {
  crate: CrateDetail | null
  source: 'live' | 'snapshot' | 'mock'
  error: string | null
}
