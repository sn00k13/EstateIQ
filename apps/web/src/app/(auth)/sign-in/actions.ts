'use server'

import { signIn } from '@/lib/auth'
import { CredentialsSignin } from 'next-auth'
import { unstable_rethrow } from 'next/navigation'
import { logger } from '@/lib/logger'

export type LoginState = { error: string } | null

function isCredentialsSignin(e: unknown): boolean {
  if (e instanceof CredentialsSignin) return true
  return (
    typeof e === 'object' &&
    e !== null &&
    'type' in e &&
    (e as { type: string }).type === 'CredentialsSignin'
  )
}

/**
 * Server-side credentials sign-in uses Next.js `cookies().set()` (see next-auth/lib/actions.js)
 * instead of relying on Set-Cookie from a browser fetch — fixes empty sessions on Netlify/production.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const turnstileToken = formData.get('turnstileToken')?.toString().trim() ?? ''

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      ...(turnstileToken ? { turnstileToken } : {}),
      redirectTo: '/dashboard',
    })
  } catch (error) {
    // Successful signIn calls redirect() which throws — must rethrow so Next.js completes the redirect.
    unstable_rethrow(error)
    if (isCredentialsSignin(error)) {
      return { error: 'Invalid email or password' }
    }
    logger.error('[loginAction] signIn failed', error)
    return { error: 'Unable to sign in. Please try again.' }
  }

  return null
}
