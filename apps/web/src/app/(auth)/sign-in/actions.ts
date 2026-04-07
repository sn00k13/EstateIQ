'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export type LoginState = { error: string } | null

function isNextRedirect(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'digest' in e &&
    typeof (e as { digest: unknown }).digest === 'string' &&
    (e as { digest: string }).digest.startsWith('NEXT_REDIRECT')
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
    if (isNextRedirect(error)) throw error
    if (error instanceof AuthError) {
      return { error: 'Invalid email or password' }
    }
    throw error
  }

  return null
}
