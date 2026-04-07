'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import logo from '@/components/images/logo.png'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import {
  TurnstileWidget,
  isTurnstileWidgetEnabled,
} from '@/components/auth/TurnstileWidget'
import { loginAction, type LoginState } from './actions'

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    null as LoginState
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  const needTurnstile = isTurnstileWidgetEnabled()

  useEffect(() => {
    if (state?.error) {
      turnstileRef.current?.reset()
      setTurnstileToken(null)
    }
  }, [state?.error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src={logo}
            alt="Kynjo.Homes"
            height={66}
            width={231}
            className="h-[66px] w-auto object-contain"
          />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Login</h1>
        <p className="text-gray-500 text-sm mb-6">Sign in to your Kynjo.Homes account</p>

        {state?.error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-green-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Your password"
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <input type="hidden" name="turnstileToken" value={turnstileToken ?? ''} />

          {needTurnstile && (
            <TurnstileWidget ref={turnstileRef} onToken={setTurnstileToken} />
          )}

          <button
            type="submit"
            disabled={
              isPending ||
              !email ||
              !password ||
              (needTurnstile && !turnstileToken)
            }
            className="w-full bg-green-600 text-white rounded py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          No account?{' '}
          <a href="/sign-up" className="text-brand-600 hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  )
}
