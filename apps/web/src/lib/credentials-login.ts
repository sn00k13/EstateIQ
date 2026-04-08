import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import {
  WEB_SESSION_COOKIE,
  sessionCookieOptions,
  signWebSessionToken,
} from './auth-cookie'
import { logger } from './logger'
import { isTurnstileEnforced, verifyTurnstileToken } from './turnstile'

export type LoginOk = {
  user: { id: string; email: string; name: string | null }
}

export type LoginFail = {
  error: string
  /** Set when login-debug asks for Turnstile diagnostics */
  turnstileErrorCodes?: string[]
  /** login-debug only: exception from DB, Turnstile fetch, etc. */
  debugCatchDetail?: string
}

export type AuthenticateOptions = {
  /** Forwarded client IP — often required for Turnstile behind Netlify/CDN */
  remoteip?: string
  /** Include Cloudflare `error-codes` on Turnstile failure (login-debug only) */
  debugTurnstile?: boolean
  /** Include `debugCatchDetail` on thrown errors (login-debug only; never for normal login) */
  debugAuth?: boolean
}

/**
 * Email/password + optional Turnstile. Used by server actions and POST /api/auth/login.
 */
export async function authenticateCredentials(
  emailRaw: string,
  password: string,
  turnstileToken?: string,
  options?: AuthenticateOptions
): Promise<LoginOk | LoginFail> {
  const email = emailRaw.trim()
  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  try {
    if (isTurnstileEnforced()) {
      const t = turnstileToken?.trim()
      if (!t) return { error: 'Please complete the security check.' }
      const vr = await verifyTurnstileToken(t, options?.remoteip)
      if (!vr.ok) {
        if (vr.errorCodes?.length) {
          logger.warn('[Turnstile] verify failed', {
            errorCodes: vr.errorCodes,
            remoteip: options?.remoteip ?? null,
          })
        }
        const base = 'Security check failed. Please try again.'
        if (options?.debugTurnstile && vr.errorCodes?.length) {
          return {
            error: base,
            turnstileErrorCodes: vr.errorCodes,
          }
        }
        return { error: base }
      }
    }

    const { prisma } = await import('@estateiq/database')
    const user = await prisma.authUser.findUnique({
      where: { email },
    })

    if (!user?.passwordHash) {
      return { error: 'Invalid email or password' }
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return { error: 'Invalid email or password' }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  } catch (err) {
    logger.error('[authenticateCredentials]', err)
    const base: LoginFail = { error: 'Unable to sign in. Please try again.' }
    if (options?.debugAuth) {
      base.debugCatchDetail =
        err instanceof Error ? err.message : String(err)
    }
    return base
  }
}

export async function setWebSessionCookie(user: {
  id: string
  email: string
  name: string | null
}) {
  const token = await signWebSessionToken(user)
  const jar = await cookies()
  jar.set(WEB_SESSION_COOKIE, token, sessionCookieOptions())
}

export async function clearWebSessionCookie() {
  const jar = await cookies()
  jar.delete(WEB_SESSION_COOKIE)
}
