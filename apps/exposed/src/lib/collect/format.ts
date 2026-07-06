// Small formatting helpers shared by the client collectors.

// Coerce anything unknown into a display string, or null when absent.
export function str(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (Array.isArray(v)) return v.length ? v.join(', ') : null
  return String(v)
}

// Human byte sizes for storage quotas / heap limits.
export function bytes(n: number | undefined | null): string | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

// FNV-1a — a tiny, dependency-free 32-bit hash for fingerprint digests.
export function fnv1a(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  // unsigned hex, padded
  return (h >>> 0).toString(16).padStart(8, '0')
}
