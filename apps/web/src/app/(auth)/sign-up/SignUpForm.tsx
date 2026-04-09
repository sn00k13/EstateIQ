'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, Eye, EyeOff, Check } from 'lucide-react'
import logo from '@/components/images/logo.webp'
import { useRouter, useSearchParams } from 'next/navigation'
import { passwordMeetsPolicy, passwordRules } from '@/lib/passwordPolicy'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import {
  TurnstileWidget,
  isTurnstileWidgetEnabled,
} from '@/components/auth/TurnstileWidget'

export default function SignUpForm() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? 'STARTER'

  const needTurnstile = isTurnstileWidgetEnabled()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) {
      setError('You must agree to the Terms of Service and Privacy Policy to continue.')
      return
    }
    if (!passwordMeetsPolicy(form.password)) {
      setError('Please create a stronger password that meets all requirements below.')
      return
    }
    if (needTurnstile && !turnstileToken) {
      setError('Please complete the security check below.')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, consent: true, plan }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      turnstileRef.current?.reset()
      setTurnstileToken(null)
      return
    }

    const onboardingUrl = `/onboarding?plan=${encodeURIComponent(plan)}`

    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        ...(needTurnstile && turnstileToken ? { turnstileToken } : {}),
      }),
    })

    setLoading(false)

    if (!loginRes.ok) {
      const errBody = (await loginRes.json().catch(() => ({}))) as { error?: string }
      setError(errBody.error ?? 'Account created but sign-in failed. Please sign in manually.')
      turnstileRef.current?.reset()
      setTurnstileToken(null)
      return
    }

    router.push(onboardingUrl)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md">
        <div className="mb-6">
          <div className="flex justify-center mb-3">
            <Image
              src={logo}
              alt="Kynjo.Homes"
              height={66}
              width={231}
              className="h-[66px] w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Get your estate on Kynjo.Homes in minutes</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
              autoComplete="name"
              placeholder="e.g. Adeola Oke"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="new-password"
                placeholder="At least 8 characters with upper, lower & number"
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <ul className="mt-2 space-y-1.5" aria-live="polite">
              {passwordRules.map(rule => {
                const met = rule.test(form.password)
                return (
                  <li
                    key={rule.id}
                    className={`flex items-start gap-2 text-xs ${met ? 'text-green-700' : 'text-gray-500'}`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        met ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300'
                      }`}
                    >
                      {met ? <Check size={10} strokeWidth={3} /> : null}
                    </span>
                    <span>{rule.label}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
            />
            <label htmlFor="consent" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
              I have read and agree to the{' '}
              <Link href="/terms" target="_blank" className="text-green-600 hover:underline font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" className="text-green-600 hover:underline font-medium">
                Privacy Policy
              </Link>
              , including the collection and processing of my personal data.
            </label>
          </div>

          {needTurnstile && (
            <TurnstileWidget
              ref={turnstileRef}
              onToken={setTurnstileToken}
            />
          )}

          <button
            type="submit"
            disabled={
              loading ||
              !consent ||
              !passwordMeetsPolicy(form.password) ||
              (needTurnstile && !turnstileToken)
            }
            className="w-full bg-green-600 text-white rounded py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-green-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
