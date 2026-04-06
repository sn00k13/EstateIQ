import { PrismaClient } from './src/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const GLOBAL_DB_URL_KEY = '__ESTATEIQ_DATABASE_URL__' as const

/**
 * Do not import `node:fs` here — this package is imported from layouts/RSC and would pull
 * `fs` into Edge/ESM bundles (`require is not defined`). `/proc` + env mirroring lives in
 * `apps/web/src/instrumentation.ts` (Node-only) instead.
 *
 * Read order: instrumentation global → process.env (dynamic keys to reduce build-time inlining).
 */
function readDatabaseUrlFromEnv(): string | undefined {
  const g = globalThis as unknown as Record<string, string | undefined>
  const fromGlobal = g[GLOBAL_DB_URL_KEY]
  if (typeof fromGlobal === 'string' && fromGlobal.trim().length > 0) {
    return fromGlobal.trim()
  }

  const env =
    typeof process !== 'undefined' && process.env ? process.env : undefined
  if (!env) return undefined

  const tryKey = (k: string): string | undefined => {
    const v = Reflect.get(env, k)
    if (typeof v === 'string' && v.trim().length > 0) return v.trim()
    return undefined
  }

  // Avoid static `process.env.DATABASE_URL` — Next may inline it as undefined at build time.
  const computed = tryKey(['DATABASE', 'URL'].join('_'))
  if (computed) return computed

  // Some bundlers leave a live env object; enumeration can still see runtime keys (e.g. Netlify).
  try {
    for (const key of Object.keys(env)) {
      if (key === 'DATABASE_URL') {
        const v = env[key as keyof typeof env]
        if (typeof v === 'string' && v.trim().length > 0) return v.trim()
      }
    }
  } catch {
    // ignore
  }

  return undefined
}

/**
 * Railway / many cloud Postgres hosts require TLS when connecting from outside their network
 * (e.g. Netlify Functions). Append sslmode=require if not already present.
 */
function resolveDatabaseUrl(): string | undefined {
  const url = readDatabaseUrlFromEnv()
  if (!url) return undefined
  if (/[?&]sslmode=/.test(url)) return url
  if (url.includes('rlwy.net') || url.includes('railway.app')) {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}sslmode=require`
  }
  return url
}

function prismaClientOptions(): ConstructorParameters<typeof PrismaClient>[0] {
  const resolved = resolveDatabaseUrl()
  const base: ConstructorParameters<typeof PrismaClient>[0] = {
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  }
  if (!resolved) {
    throw new Error(
      'DATABASE_URL is not set. Add it in Netlify → Environment variables (scope: All or Functions), then redeploy.'
    )
  }
  base.datasources = { db: { url: resolved } }
  return base
}

/**
 * Create the client on first use (not at module load) so instrumentation + /proc have
 * already populated globalThis before we read the URL.
 */
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient(prismaClientOptions())
  }
  return globalForPrisma.prisma
}

/** For health checks / diagnostics — whether a non-empty DATABASE_URL is visible at runtime. */
export function isDatabaseUrlConfigured(): boolean {
  return Boolean(readDatabaseUrlFromEnv())
}

/** True if DATABASE_URL points at this machine (wrong for Netlify — use hosted DB URL). */
export function isDatabaseUrlLocalhost(): boolean {
  const u = readDatabaseUrlFromEnv()
  if (!u) return false
  return /localhost|127\.0\.0\.1/i.test(u)
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    // Use client as receiver so prototype getters (e.g. on PrismaClient) see the real instance.
    const value = Reflect.get(client, prop, client) as unknown
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client)
    }
    return value
  },
})

export * from './src/generated/prisma'