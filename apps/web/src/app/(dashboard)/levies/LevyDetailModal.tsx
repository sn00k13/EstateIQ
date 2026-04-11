'use client'
import { useEffect, useMemo, useState } from 'react'
import { X, CheckCircle2, Clock, Loader2, ExternalLink, ShieldCheck, Search, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import { useResident } from '@/context/ResidentContext'
import LevyPayModal from './LevyPayModal'
import LevyPaymentDetailModal from './LevyPaymentDetailModal'
import DashboardConfirmDialog from '@/components/dashboard/DashboardConfirmDialog'
import DashboardToast, { type DashboardToastPayload } from '@/components/dashboard/DashboardToast'

interface PaymentRow {
  id: string
  status: string
  amount: number
  paidAt: string | null
  reference: string | null
  receiptUrl: string | null
  unit:     { id: string; number: string; block: string | null }
  resident: { id: string; firstName: string; lastName: string; email: string }
}

interface LevyDetail {
  id: string
  title: string
  description: string | null
  amount: number
  dueDate: string
  residentCount: number
  estate: {
    name: string
    duesBankName: string | null
    duesAccountNumber: string | null
  }
  payments: PaymentRow[]
}

interface Props {
  levy: { id: string; title: string; amount: number }
  onClose: () => void
}

function matchesPaymentSearch(p: PaymentRow, q: string) {
  if (!q.trim()) return true
  const s = q.trim().toLowerCase()
  const unit = `${p.unit.block ?? ''} ${p.unit.number}`.toLowerCase()
  const name = `${p.resident.firstName} ${p.resident.lastName}`.toLowerCase()
  const email = p.resident.email.toLowerCase()
  const status =
    p.status === 'PAID'
      ? 'paid'
      : p.receiptUrl
        ? 'pending approval receipt'
        : 'pending'
  return (
    unit.includes(s) ||
    name.includes(s) ||
    email.includes(s) ||
    status.includes(s) ||
    (p.reference?.toLowerCase().includes(s) ?? false)
  )
}

export default function LevyDetailModal({ levy, onClose }: Props) {
  const { profile, isAdmin } = useResident()
  const [detail, setDetail]     = useState<LevyDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [payModalPaymentId, setPayModalPaymentId] = useState<string | null>(null)
  const [filter, setFilter]     = useState<'ALL' | 'PAID' | 'PENDING'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailPaymentId, setDetailPaymentId] = useState<string | null>(null)
  const [approvePaymentId, setApprovePaymentId] = useState<string | null>(null)
  const [toast, setToast] = useState<DashboardToastPayload | null>(null)

  async function loadDetail() {
    const { data } = await fetchJson<LevyDetail>(`/api/levies/${levy.id}`)
    setDetail(data ?? null)
  }

  useEffect(() => {
    async function load() {
      await loadDetail()
      setLoading(false)
    }
    load()
  }, [levy.id])

  /* Custom Paystack card payment — re-enable when wired per estate.
  async function handlePaystack(paymentId: string) {
    const { data, error } = await fetchJson<{ authorizationUrl: string }>(
      '/api/payments/initialize',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      }
    )
    if (error) {
      setToast({ message: error, variant: 'error' })
      return
    }
    if (data?.authorizationUrl) window.open(data.authorizationUrl, '_blank')
  }
  */

  async function executeApprove() {
    if (!approvePaymentId) return
    const paymentId = approvePaymentId
    setApproving(paymentId)
    const { error } = await fetchJson(`/api/payments/${paymentId}/approve`, { method: 'PATCH' })
    setApproving(null)
    setApprovePaymentId(null)
    if (error) {
      setToast({ message: error, variant: 'error' })
      return
    }
    await loadDetail()
    setDetailPaymentId(null)
  }

  function fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG')
  }

  const payments = detail?.payments ?? []
  const filtered =
    filter === 'ALL'    ? payments :
    filter === 'PAID'   ? payments.filter(p => p.status === 'PAID') :
                          payments.filter(p => p.status === 'PENDING')

  const searchFiltered = useMemo(
    () => filtered.filter(p => matchesPaymentSearch(p, searchQuery)),
    [filtered, searchQuery]
  )

  const paid    = payments.filter(p => p.status === 'PAID').length
  const pending = payments.filter(p => p.status === 'PENDING').length
  const paidPercent = payments.length > 0 ? Math.round((paid / payments.length) * 100) : 0

  const rc = detail?.residentCount ?? 0
  const totalDueExpectedEstate = levy.amount * rc
  const showResidentTable = isAdmin

  const payModalRow = payModalPaymentId
    ? payments.find(p => p.id === payModalPaymentId)
    : null

  const detailPayment = detailPaymentId
    ? payments.find(p => p.id === detailPaymentId)
    : null

  return (
    <>
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">{levy.title}</h2>
            {!loading && detail && (
              <p className="text-xs text-gray-400 mt-0.5">
                {isAdmin
                  ? `${fmt(levy.amount)} per unit · Total dues expected ${fmt(totalDueExpectedEstate)}${rc ? ` (${rc} residents)` : ''}`
                  : `${fmt(levy.amount)} due for this levy · Your payment only`}
              </p>
            )}
            {loading && (
              <p className="text-xs text-gray-400 mt-0.5">{fmt(levy.amount)} per unit</p>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
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
              {isAdmin ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Your payment</span>
                    <span className="font-semibold text-gray-900">
                      {payments.length === 0 ? '—' : paidPercent === 100 ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        paidPercent === 100 ? 'bg-green-500' : 'bg-brand-500'
                      )}
                      style={{ width: `${payments.length === 0 ? 0 : paidPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {payments.length === 0 ? (
                      <span className="text-gray-500">No payment record for you on this levy yet.</span>
                    ) : paid > 0 ? (
                      <span className="text-green-600 font-medium">{fmt(levy.amount)} paid</span>
                    ) : (
                      <span className="text-amber-600 font-medium">{fmt(levy.amount)} due</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Search + filter tabs — estate admins */}
            {isAdmin && (
              <div className="px-6 py-3 border-b border-gray-100 shrink-0 space-y-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search unit, name, email, status, reference…"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(['ALL', 'PAID', 'PENDING'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
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
              </div>
            )}

            {/* Search only (resident — no status tabs) */}
            {!isAdmin && payments.length > 0 && (
              <div className="px-6 py-3 border-b border-gray-100 shrink-0">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search unit, status…"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>
            )}

            {/* Payment rows */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {searchFiltered.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm px-4">
                  {filtered.length === 0
                    ? isAdmin
                      ? `No ${filter.toLowerCase()} payments.`
                      : 'No payment assigned to you for this levy.'
                    : 'No payments match your search.'}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {(showResidentTable
                        ? ['Unit', 'Resident', 'Status', 'Paid on', 'Details', 'Action']
                        : ['Unit', 'Status', 'Paid on', 'Details', 'Action']
                      ).map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {searchFiltered.map(p => {
                      const isMine = profile?.id === p.resident.id
                      const pendingApproval = p.status === 'PENDING' && p.receiptUrl
                      return (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900 text-sm">
                            {p.unit.block ? `${p.unit.block}, ` : ''}{p.unit.number}
                          </td>
                          {showResidentTable && (
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-800">{p.resident.firstName} {p.resident.lastName}</p>
                              <p className="text-xs text-gray-400">{p.resident.email}</p>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            {p.status === 'PAID' ? (
                              <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                <CheckCircle2 size={12} /> Paid
                              </span>
                            ) : pendingApproval ? (
                              <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                                <Clock size={12} /> Pending approval
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
                            <button
                              type="button"
                              onClick={() => setDetailPaymentId(p.id)}
                              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                            >
                              <FileText size={12} />
                              View
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {p.status === 'PENDING' && isMine && !p.receiptUrl && (
                              <button
                                onClick={() => setPayModalPaymentId(p.id)}
                                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                              >
                                Pay now
                              </button>
                            )}
                            {p.status === 'PENDING' && isMine && p.receiptUrl && (
                              <span className="text-xs text-gray-400">Awaiting admin</span>
                            )}
                            {p.status === 'PENDING' && isAdmin && p.receiptUrl && (
                              <div className="flex flex-col gap-1 items-start">
                                <a
                                  href={p.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                                >
                                  <ExternalLink size={11} /> Receipt
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setApprovePaymentId(p.id)}
                                  disabled={approving === p.id}
                                  className="inline-flex items-center gap-1 text-xs text-green-700 font-medium disabled:opacity-50"
                                >
                                  {approving === p.id ? (
                                    <Loader2 size={11} className="animate-spin" />
                                  ) : (
                                    <ShieldCheck size={11} />
                                  )}
                                  Approve
                                </button>
                              </div>
                            )}
                            {p.status === 'PAID' && (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {payModalPaymentId && detail?.estate && payModalRow && (
        <LevyPayModal
          paymentId={payModalPaymentId}
          amount={payModalRow.amount}
          levyTitle={detail.title}
          estateName={detail.estate.name}
          duesBankName={detail.estate.duesBankName}
          duesAccountNumber={detail.estate.duesAccountNumber}
          onClose={() => setPayModalPaymentId(null)}
          onSuccess={() => { loadDetail() }}
        />
      )}

      {detailPayment && detail && (
        <LevyPaymentDetailModal
          payment={detailPayment}
          levyTitle={detail.title}
          levyAmount={levy.amount}
          levyDueDate={detail.dueDate}
          estateName={detail.estate.name}
          isAdmin={!!isAdmin}
          isMine={profile?.id === detailPayment.resident.id}
          approving={approving === detailPayment.id}
          onClose={() => setDetailPaymentId(null)}
          onPayNow={() => {
            setDetailPaymentId(null)
            setPayModalPaymentId(detailPayment.id)
          }}
          onApprove={() => setApprovePaymentId(detailPayment.id)}
        />
      )}
    </div>

      <DashboardConfirmDialog
        open={approvePaymentId !== null}
        title="Approve payment"
        description="Mark this transfer as received and approved? Residents will see it as paid."
        confirmLabel="Approve"
        cancelLabel="Cancel"
        variant="primary"
        loading={approvePaymentId !== null && approving === approvePaymentId}
        onCancel={() => setApprovePaymentId(null)}
        onConfirm={() => void executeApprove()}
      />

      <DashboardToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
