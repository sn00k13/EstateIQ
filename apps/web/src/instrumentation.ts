const GLOBAL_KEY = '__ESTATEIQ_DATABASE_URL__' as const

/** Dynamic import keeps `node:fs` out of the module graph until `register()` runs (Node only). */
async function readDatabaseUrlFromLinuxProc(): Promise<string | undefined> {
  if (typeof process === 'undefined' || process.platform === 'win32') return undefined
  try {
    const { readFileSync } = await import('node:fs')
    const raw = readFileSync('/proc/self/environ', 'utf8')
    for (const entry of raw.split('\0')) {
      if (entry.startsWith('DATABASE_URL=')) {
        const v = entry.slice('DATABASE_URL='.length)
        if (v.trim().length > 0) return v.trim()
      }
    }
  } catch {
    // Not Linux or unreadable
  }
  return undefined
}

/**
 * Runs once per server cold start. Copies DATABASE_URL to globalThis so the DB package
 * can read it even when Next.js/webpack inlines `process.env.DATABASE_URL` as undefined.
 * Falls back to /proc/self/environ on Linux (real OS env on Netlify).
 */
export async function register() {
  let url: string | undefined =
    typeof process !== 'undefined'
      ? Reflect.get(process.env, ['DATABASE', 'URL'].join('_'))
      : undefined
  if (typeof url !== 'string' || url.trim().length === 0) {
    url = await readDatabaseUrlFromLinuxProc()
  }
  if (typeof url === 'string' && url.trim().length > 0) {
    ;(globalThis as unknown as Record<string, string | undefined>)[GLOBAL_KEY] = url.trim()
  }
}
