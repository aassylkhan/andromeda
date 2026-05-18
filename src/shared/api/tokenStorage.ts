/**
 * Dual-write token persistence: localStorage (synchronous, fast) + IndexedDB (resilient).
 *
 * iOS standalone (PWA) mode can evict localStorage under memory pressure even
 * with a registered service worker. IndexedDB is more resilient — it survives
 * app restarts, memory pressure, and the 7-day ITP cap that affects
 * sessionStorage/cookies in WebKit.
 *
 * On read, localStorage is checked first (synchronous — needed by Axios
 * interceptors). If it's empty, the IndexedDB value is promoted back into
 * localStorage so subsequent synchronous reads work.
 *
 * On write, both stores are updated. On clear, both are wiped.
 */

const DB_NAME = 'andromeda-auth'
const DB_VERSION = 1
const STORE_NAME = 'tokens'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: string): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, key)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // IndexedDB can fail in private browsing on some browsers — non-fatal.
  }
}

async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    return new Promise((resolve) => {
      req.onsuccess = () => resolve((req.result as string) ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(key)
  } catch {
    // non-fatal
  }
}

// ---- Public API (same shape as the original tokens.ts) ----

export interface DualTokenStorage {
  set: (key: string, value: string) => void
  get: (key: string) => string | null
  remove: (key: string) => void
  /** Async recovery: promote IndexedDB → localStorage if LS is empty. */
  recover: (key: string) => Promise<string | null>
}

export const dualStorage: DualTokenStorage = {
  set(key: string, value: string) {
    localStorage.setItem(key, value)
    void idbSet(key, value)
  },

  get(key: string) {
    return localStorage.getItem(key)
  },

  remove(key: string) {
    localStorage.removeItem(key)
    void idbDelete(key)
  },

  async recover(key: string) {
    const ls = localStorage.getItem(key)
    if (ls) return ls

    const idb = await idbGet(key)
    if (idb) {
      localStorage.setItem(key, idb)
    }
    return idb
  },
}
