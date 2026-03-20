'use client'
import { useState } from 'react'
import { X, ShieldCheck, Loader2, CheckCircle2, AlertCircle, LogOut } from 'lucide-react'
import { fetchJson } from '@/lib/fetchJson'
import { cn } from '@/lib/utils'

interface CheckinResult {
  visitorName:  string
  purpose:      string | null
  residentName: string
  unit:         string
}

interface Props { onClose: () => void; onCheckin: () => void }

export default function GateCheckinPanel({ onClose, onCheckin }: Props) {
  const [code, setCode]                 = useState('')
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState<CheckinResult | null>(null)
  const [error, setError]               = useState('')
  const [checkoutId, setCheckoutId]     = useState('')
  const [checkingOut, setCheckingOut]   = useState(false)
  const [checkoutDone, setCheckoutDone] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const { data, error } = await fetchJson<CheckinResult>('/api/visitors/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessCode: code.trim() }),
    })

    if (error) { setError(error); setLoading(false); return }
    setResult(data)
    onCheckin()
    setLoading(false)
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setCheckingOut(true)
    setCheckoutError('')

    const { error } = await fetchJson('/api/visitors/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: checkoutId.trim() }),
    })

    setCheckingOut(false)
    if (error) { setCheckoutError(error); return }

    setCheckoutDone(true)
    setCheckoutId('')
    onCheckin()
    setTimeout(() => setCheckoutDone(false), 3000)
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-green-600" />
            <h2 className="font-semibold text-gray-900">Gate check-in</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* ── ARRIVING ────────────────────────────── */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Visitor arriving</h3>

            <form onSubmit={handleCheckin} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Enter 6-digit access code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setError('')
                    setResult(null)
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-2xl font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {result && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                    <CheckCircle2 size={16} /> Visitor checked in
                  </div>
                  <div className="text-sm text-green-800 space-y-0.5 pl-1">
                    <p><span className="font-medium">Name:</span> {result.visitorName}</p>
                    <p><span className="font-medium">Purpose:</span> {result.purpose ?? 'Not specified'}</p>
                    <p><span className="font-medium">Visiting:</span> {result.residentName}</p>
                    <p><span className="font-medium">Unit:</span> {result.unit}</p>
                  </div>
                  <p className="text-xs text-green-600 pt-1">
                    Resident has been notified in real-time.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={code.length !== 6 || loading}
                className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Checking in...</>
                  : 'Confirm entry'
                }
              </button>

              {result && (
                <button
                  type="button"
                  onClick={() => { setCode(''); setResult(null); setError('') }}
                  className="w-full border border-gray-200 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  Check in another visitor
                </button>
              )}
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">visitor leaving?</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* ── LEAVING ─────────────────────────────── */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <LogOut size={14} className="text-gray-400" /> Log exit
            </h3>

            {checkoutError && (
              <p className="text-xs text-red-600 mb-2">{checkoutError}</p>
            )}

            <form onSubmit={handleCheckout} className="flex gap-2">
              <input
                type="text"
                value={checkoutId}
                onChange={e => { setCheckoutId(e.target.value); setCheckoutError('') }}
                placeholder="Paste visitor ID to log exit"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
              <button
                type="submit"
                disabled={!checkoutId.trim() || checkingOut}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shrink-0',
                  checkoutDone
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50'
                )}
              >
                {checkingOut ? <Loader2 size={12} className="animate-spin" /> : null}
                {checkoutDone ? <><CheckCircle2 size={12} /> Done</> : 'Log exit'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}