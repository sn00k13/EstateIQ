'use client'

import { useState } from 'react'

type Step = { step: string; ok: boolean; detail?: string }

export default function LoginTestPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [loading, setLoading] = useState<'idle' | 'diag' | 'api'>('idle')
  const [lastResponse, setLastResponse] = useState<string>('')

  async function runDiagnostic() {
    setLoading('diag')
    setLastResponse('')
    try {
      const res = await fetch('/api/auth/login-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          turnstileToken: turnstileToken.trim() || undefined,
        }),
      })
      const text = await res.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = text
      }
      setLastResponse(
        JSON.stringify(
          {
            httpStatus: res.status,
            ok: res.ok,
            body: parsed,
          },
          null,
          2
        )
      )
    } catch (e) {
      setLastResponse(`fetch threw: ${String(e)}`)
    } finally {
      setLoading('idle')
    }
  }

  async function runRealApiLogin() {
    setLoading('api')
    setLastResponse('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          turnstileToken: turnstileToken.trim() || undefined,
        }),
      })
      const text = await res.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = text
      }
      setLastResponse(
        JSON.stringify(
          {
            httpStatus: res.status,
            ok: res.ok,
            body: parsed,
            note:
              'HttpOnly cookie is not visible in document.cookie. If ok:true, open /dashboard in this tab.',
          },
          null,
          2
        )
      )
    } catch (e) {
      setLastResponse(`fetch threw: ${String(e)}`)
    } finally {
      setLoading('idle')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-mono text-sm">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-white mb-1">Login test</h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            Minimal page to see where failures happen.{' '}
            <span className="text-amber-400/90">
              Step-by-step diagnostic is disabled on production unless you set{' '}
              <code className="text-amber-300">ENABLE_LOGIN_TEST=true</code> in Netlify.
            </span>{' '}
            Local dev always allows it.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/80 p-4">
          <label className="block">
            <span className="text-slate-400 text-xs">email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="text-slate-400 text-xs">password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              autoComplete="current-password"
            />
          </label>
          <label className="block">
            <span className="text-slate-400 text-xs">
              turnstile token (optional — paste if widget is on main sign-in)
            </span>
            <textarea
              value={turnstileToken}
              onChange={e => setTurnstileToken(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="Leave empty if Turnstile is not enforced on the server"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => void runDiagnostic()}
              disabled={loading !== 'idle' || !email || !password}
              className="rounded bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-40"
            >
              {loading === 'diag' ? 'Running…' : '1. Step-by-step diagnostic'}
            </button>
            <button
              type="button"
              onClick={() => void runRealApiLogin()}
              disabled={loading !== 'idle' || !email || !password}
              className="rounded bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-40"
            >
              {loading === 'api' ? 'Running…' : '2. Real POST /api/auth/login'}
            </button>
            <a
              href="/sign-in"
              className="inline-flex items-center rounded border border-slate-600 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              ← Normal sign-in
            </a>
          </div>
        </div>

        <div>
          <div className="text-slate-500 text-xs mb-2">Last response</div>
          <pre className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 p-4 text-xs text-emerald-200/90 whitespace-pre-wrap break-all min-h-[120px]">
            {lastResponse || '— run a test above —'}
          </pre>
        </div>
      </div>
    </div>
  )
}
