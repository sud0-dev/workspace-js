const HASH_KEY = 'code='
const MAX_BYTES = 32 * 1024

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): string | null {
  try {
    const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4)
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

// Returns the source from #code=… and clears the hash so refresh doesn't keep applying it.
// Returns null when no valid hash is present.
export function consumeShareLink(): string | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash.startsWith(HASH_KEY)) return null
  const encoded = hash.slice(HASH_KEY.length)
  const source = fromBase64Url(encoded)
  if (source == null || source.length === 0) return null
  history.replaceState(null, '', window.location.pathname + window.location.search)
  return source
}

export function buildShareLink(source: string): string | null {
  if (typeof window === 'undefined') return null
  if (new TextEncoder().encode(source).byteLength > MAX_BYTES) return null
  return `${window.location.origin}${window.location.pathname}#${HASH_KEY}${toBase64Url(source)}`
}
