'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react'
import { fetchJson } from '@/lib/fetchJson'

interface TokenInfo {
  valid:      boolean
  email:      string
  firstName:  string
  lastName:   string
  estateName: string
}

export default function AcceptInviteClient() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [info, setInfo]           = useState<TokenInfo | null>(null)
  const [tokenError, setTokenError] = useState('')
  const [validating, setValidating] = useState(true)

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)

  useEffect(() => {
    if (!token) {
      setTokenError('No invitation token found in this link.')
      setValidating(false)
      return
    }

    async function validate() {
      const { data, error } = await fetchJson<TokenInfo>(
        `/api/residents/accept-invite?token=${token}`
      )
      setValidating(false)
      if (error) { setTokenError(error); return }
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

    setLoading(true)
    setError('')

    const { error } = await fetchJson('/api/residents/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    setLoading(false)
    if (error) { setError(error); return }
    setDone(true)

    // Redirect to sign in after 3 seconds
    setTimeout(() => router.push('/sign-in'), 3000)
  }

  // Password strength indicator
  function strength(pw: string) {
    if (pw.length === 0) return null
    if (pw.length < 6)   return { label: 'Too short',  color: 'bg-red-400',   width: '25%'  }
    if (pw.length < 8)   return { label: 'Weak',       color: 'bg-amber-400', width: '50%'  }
    if (pw.length < 12)  return { label: 'Good',       color: 'bg-brand-500',  width: '75%'  }
    return                      { label: 'Strong',     color: 'bg-green-500', width: '100%' }
  }

  const pwStrength = strength(password)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4">
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">EstateIQ</h1>
        </div>

        {/* Validating */}
        {validating && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Loader2 size={28} className="animate-spin text-brand-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Validating your invitation...</p>
          </div>
        )}

        {/* Token error */}
        {!validating && tokenError && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">✕</span>
            </div>
            <h2 className="font-semibold text-gray-900 mb-2">Link invalid</h2>
            <p className="text-sm text-gray-500">{tokenError}</p>
            <a href="/sign-in" className="inline-block mt-4 text-sm text-brand-600 hover:underline">
              Go to sign in
            </a>
          </div>
        )}

        {/* Success state */}
        {done && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-2">Account activated!</h2>
            <p className="text-sm text-gray-500">
              Your password has been set. Redirecting you to sign in...
            </p>
          </div>
        )}

        {/* Set password form */}
        {!validating && !tokenError && !done && info && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

            {/* Welcome header */}
            <div className="bg-brand-600 rounded-t-2xl px-6 py-5">
              <p className="text-blue-100 text-sm">You've been invited to</p>
              <h2 className="text-white font-semibold text-lg">{info.estateName}</h2>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div>
                <h3 className="font-semibold text-gray-900 text-base">
                  Hello, {info.firstName} {info.lastName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Set a password for <span className="font-medium text-gray-700">{info.email}</span> to activate your account.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Password */}
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
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {pwStrength && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pwStrength.color}`}
                          style={{ width: pwStrength.width }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pwStrength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
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
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 ${
                      confirm && confirm !== password
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  />
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm || password !== confirm}
                  className="w-full bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Activating account...</>
                    : 'Activate my account'
                  }
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}