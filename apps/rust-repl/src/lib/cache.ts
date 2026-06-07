import type { EvalEvent } from '#/state/notebook'

const DB_NAME = 'foundry'
const DB_VERSION = 1
const STORE = 'compile_v1'
const MAX_ENTRIES = 200

type CacheEntry = {
  hash: string
  events: EvalEvent[]
  exitCode: number
  storedAt: number
  lastAccessed: number
}

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'hash' })
        store.createIndex('lastAccessed', 'lastAccessed')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => Promise<T> | T) {
  return openDb().then((db) => {
    if (!db) return null as T | null
    return new Promise<T | null>((resolve) => {
      const t = db.transaction(STORE, mode)
      const store = t.objectStore(STORE)
      let value: T | null = null
      Promise.resolve(fn(store)).then((v) => {
        value = v ?? null
      })
      t.oncomplete = () => resolve(value)
      t.onerror = () => resolve(null)
      t.onabort = () => resolve(null)
    })
  })
}

function reqAsync<T>(req: IDBRequest<T>): Promise<T | null> {
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
}

export async function getCached(hash: string): Promise<CacheEntry | null> {
  const entry = await tx<CacheEntry>('readwrite', async (store) => {
    const got = await reqAsync(store.get(hash))
    if (!got) return null
    const next = { ...got, lastAccessed: Date.now() }
    store.put(next)
    return next
  })
  return entry ?? null
}

export async function setCached(
  hash: string,
  events: EvalEvent[],
  exitCode: number,
): Promise<void> {
  await tx<void>('readwrite', async (store) => {
    const now = Date.now()
    store.put({ hash, events, exitCode, storedAt: now, lastAccessed: now })
    // Trim LRU when oversized
    const countReq = store.count()
    const count = await reqAsync(countReq)
    if (count != null && count > MAX_ENTRIES) {
      const idx = store.index('lastAccessed')
      const cursorReq = idx.openCursor()
      let toDelete = count - MAX_ENTRIES
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result
        if (cursor && toDelete > 0) {
          cursor.delete()
          toDelete--
          cursor.continue()
        }
      }
    }
  })
}

export async function clearCache(): Promise<void> {
  await tx<void>('readwrite', (store) => {
    store.clear()
  })
}

export async function cacheSize(): Promise<number> {
  const n = await tx<number>('readonly', async (store) => {
    const c = await reqAsync(store.count())
    return c ?? 0
  })
  return n ?? 0
}
