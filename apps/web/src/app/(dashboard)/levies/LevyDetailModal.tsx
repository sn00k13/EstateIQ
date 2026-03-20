'use client'
import { useEffect, useState } from 'react'
import { X, CheckCircle2, Clock, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'

interface PaymentRow {
  id: string
  status: string
  amount: number
  paidAt: string | null
  reference: string | null
  unit:     { id: string; number: string; block: string | null }
  resident: { id: string; firstName: string; lastName: string; email: string }
}

interface LevyDetail {
  id: string
  title: string
  description: string | null
  amount: number
  dueDate: string
  payments: PaymentRow[]
}

interface Props {
  levy: { id: string; title: string; amount: number }
  onClose: () => void
}

export default function LevyDetailModal({ levy, onClose }: Props) {
  const [detail, setDetail]     = useState<LevyDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [paying, setPaying]     = useState<string | null>(null)
  const [filter, setFilter]     = useState<'ALL' | 'PAID' | 'PENDING'>('ALL')

  useEffect(() => {
    async function load() {
      const { data } = await fetchJson<LevyDetail>(`/api/levies/${levy.id}`)
      setDetail(data)
      setLoading(false)
    }
    load()
  }, [levy.id])

  async function handlePay(paymentId: string) {
    setPaying(paymentId)
    const { data, error } = await fetchJson<{ authorizationUrl: string }>(
      '/api/payments/initialize',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      }
    )
    setPaying(null)
    if (error) { alert(error); return }
    if (data?.authorizationUrl) window.open(data.authorizationUrl, '_blank')
  }

  function fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG')
  }

  const payments = detail?.payments ?? []
  const filtered =
    filter === 'ALL'    ? payments :
    filter === 'PAID'   ? payments.filter(p => p.status === 'PAID') :
                          payments.filter(p => p.status === 'PENDING')

  const paid    = payments.filter(p => p.status === 'PAID').length
  const pending = payments.filter(p => p.status === 'PENDING').length
  const paidPercent = payments.length > 0 ? Math.round((paid / payments.length) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">{levy.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Payment tracker — {fmt(levy.amount)} per unit</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Progress summary */}
            <div className="px-6 py-4 border-b border-gray-100 shrink-0 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{paid} of {payments.length} units paid</span>
                <span className="font-semibold text-gray-900">{paidPercent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    paidPercent === 100 ? 'bg-green-500' : 'bg-brand-500'
                  )}
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="text-green-600 font-medium">
                  {fmt(paid * levy.amount)} collected
                </span>
                <span className="text-amber-600 font-medium">
                  {fmt(pending * levy.amount)} outstanding
                </span>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="px-6 py-3 border-b border-gray-100 flex gap-2 shrink-0">
              {(['ALL', 'PAID', 'PENDING'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    filter === f
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  )}
                >
                  {f === 'ALL' ? `All (${payments.length})` :
                   f === 'PAID' ? `Paid (${paid})` : `Pending (${pending})`}
                </button>
              ))}
            </div>

            {/* Payment rows */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  No {filter.toLowerCase()} payments.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {['Unit', 'Resident', 'Status', 'Paid on', 'Action'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 text-sm">
                          {p.unit.block ? `${p.unit.block}, ` : ''}{p.unit.number}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-800">{p.resident.firstName} {p.resident.lastName}</p>
                          <p className="text-xs text-gray-400">{p.resident.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {p.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                              <CheckCircle2 size={12} /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {p.paidAt
                            ? new Date(p.paidAt).toLocaleDateString('en-NG', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {p.status === 'PENDING' ? (
                            <button
                              onClick={() => handlePay(p.id)}
                              disabled={paying === p.id}
                              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
                            >
                              {paying === p.id
                                ? <Loader2 size={11} className="animate-spin" />
                                : <ExternalLink size={11} />
                              }
                              Pay now
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}