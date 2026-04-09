'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react'
import { fetchJson } from '@/lib/fetchJson'
import Link from 'next/link'
import logo from '@/components/images/logo.webp'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import {
  TurnstileWidget,
  isTurnstileWidgetEnabled,
} from '@/components/auth/TurnstileWidget'

interface TokenInfo {
  valid: boolean
  email: string
  firstName: string
  lastName: string
  estateName: string
  estateSlug: string
  address: string | null
}

function AcceptInviteForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [tokenError, setTokenError] = useState('')
  const [validating, setValidating] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [consent, setConsent] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  const needTurnstile = isTurnstileWidgetEnabled()

  useEffect(() => {
    if (!token) {
      setTokenError('No invitation token found in this link.')
      setValidating(false)
      return
    }

    async function validate() {
      if (!token) return
      const { data, error: err } = await fetchJson<TokenInfo>(
        `/api/residents/accept-invite?token=${encodeURIComponent(token)}`
      )
      setValidating(false)
      if (err) {
        setTokenError(err)
        return
      }
      setInfo(data)
    }

    validate()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (!consent) {
      setError('You must agree to the Terms of Service and Privacy Policy to continue.')
      return
    }
    if (!info?.email) {
      setError('Missing invitation details.')
      return
    }
    if (needTurnstile && !turnstileToken) {
      setError('Please complete the security check below.')
      return
    }

    setLoading(true)
    setError('')

    const { error: postErr } = await fetchJson('/api/residents/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, consent: true }),
    })

    if (postErr) {
      setLoading(false)
      setError(postErr)
      turnstileRef.current?.reset()
      setTurnstileToken(null)
      return
    }

    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: info.email,
        password,
        ...(needTurnstile && turnstileToken ? { turnstileToken } : {}),
      }),
    })

    setLoading(false)

    if (!loginRes.ok) {
      setNeedsSignIn(true)
      turnstileRef.current?.reset()
      setTurnstileToken(null)
      return
    }

    setDone(true)
    setTimeout(() => {
      router.replace(`/${info.estateSlug}`)
    }, 1500)
  }

  function strength(pw: string) {
    if (pw.length === 0) return null
    if (pw.length < 6) return { label: 'Too short', color: 'bg-red-400', width: '25%' }
    if (pw.length < 8) return { label: 'Weak', color: 'bg-amber-400', width: '50%' }
    if (pw.length < 12) return { label: 'Good', color: 'bg-blue-500', width: '75%' }
    return { label: 'Strong', color: 'bg-green-500', width: '100%' }
  }

  const pwStrength = strength(password)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src={logo}
              alt="Kynjo.Homes"
              height={66}
              width={231}
              className="h-[66px] w-auto object-contain rounded"
            />
          </div>
        </div>

        {validating && (
          <div className="bg-white rounded border border-gray-100 p-8 text-center">
            <Loader2 size={28} className="animate-spin text-green-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Validating your invitation...</p>
          </div>
        )}

        {!validating && tokenError && (
          <div className="bg-white rounded border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 rounded bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl font-bold">X</span>
            </div>
            <h2 className="font-sans font-semibold text-gray-900 mb-2">Link invalid</h2>
            <p className="text-sm text-gray-500">{tokenError}</p>
            <a href="/sign-in" className="inline-block mt-4 text-sm text-green-600 hover:underline">
              Go to sign in
            </a>
          </div>
        )}

        {needsSignIn && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-amber-600" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-2">Account activated</h2>
            <p className="text-sm text-gray-500 mb-4">
              Your password is set. Please sign in to continue to {info?.estateName}.
            </p>
            <Link
              href="/sign-in"
              className="inline-block text-sm font-medium text-green-600 hover:underline"
            >
              Go to sign in
            </Link>
          </div>
        )}

        {done && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-2">Account activated!</h2>
            <p className="text-sm text-gray-500">
              Welcome to {info?.estateName}. Taking you to your estate...
            </p>
          </div>
        )}

        {!validating && !tokenError && !done && !needsSignIn && info && (
          <div className="bg-white rounded border border-gray-100 shadow-sm">
            <div className="px-6 py-6 space-y-5">
              <div>
                <p className="text-gray-500 text-sm mb-1">You have been invited to {info.estateName}</p>
                <h3 className="font-sans font-semibold text-gray-900 text-base">
                  Hello, {info.firstName} {info.lastName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Set a password for{' '}
                  <span className="font-medium text-gray-700">{info.email}</span> to activate your account.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="At least 8 characters"
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

                  {pwStrength && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-100 rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all ${pwStrength.color}`}
                          style={{ width: pwStrength.width }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pwStrength.label}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="Repeat your password"
                    className={`w-full border rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      confirm && confirm !== password
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  />
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="invite-consent"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <label
                    htmlFor="invite-consent"
                    className="text-sm text-gray-600 cursor-pointer leading-relaxed"
                  >
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-green-600 hover:underline font-medium"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-green-600 hover:underline font-medium"
                    >
                      Privacy Policy
                    </Link>
                    , including processing of my personal data by Kynjo.Homes.
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
                    !password ||
                    !confirm ||
                    password !== confirm ||
                    !consent ||
                    (needTurnstile && !turnstileToken)
                  }
                  className="w-full bg-green-600 text-white rounded py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Activating account...
                    </>
                  ) : (
                    'Activate my account'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AcceptInviteClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Loader2 size={28} className="animate-spin text-green-600" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  )
}
