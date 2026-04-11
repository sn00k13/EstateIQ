'use client'
import { useEffect, useState } from 'react'
import { Plus, CreditCard, Trash2, TrendingUp, Clock, CheckCircle2, Building2, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import CreateLevyModal from './CreateLevyModal'
import LevyDetailModal from './LevyDetailModal'
import { useResident } from '@/context/ResidentContext'
import DashboardConfirmDialog from '@/components/dashboard/DashboardConfirmDialog'
import DashboardToast, { type DashboardToastPayload } from '@/components/dashboard/DashboardToast'

interface Levy {
  id: string
  title: string
  description: string | null
  amount: number
  currency: string
  dueDate: string
  createdAt: string
  _count: { total: number; paid: number; pending: number }
  amountCollected: number
  /** Sum of pending payment amounts for the viewer (from API). */
  pendingAmount?: number
}

interface EstateMeta {
  estate: {
    id: string
    name: string
    duesBankName: string | null
    duesAccountNumber: string | null
  }
  residentCount: number
}

export default function LeviesClient() {
  const { isAdmin } = useResident()
  const [levies, setLevies]                   = useState<Levy[]>([])
  const [meta, setMeta]                       = useState<EstateMeta | null>(null)
  const [loading, setLoading]                 = useState(true)
  const [showCreate, setShowCreate]           = useState(false)
  const [selectedLevy, setSelectedLevy]       = useState<Levy | null>(null)
  const [deleting, setDeleting]               = useState<string | null>(null)
  const [bankName, setBankName]               = useState('')
  const [accountNo, setAccountNo]             = useState('')
  const [savingBank, setSavingBank]           = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [toast, setToast]                     = useState<DashboardToastPayload | null>(null)

  async function load() {
    setLoading(true)
    const [leviesRes, metaRes] = await Promise.all([
      fetchJson<Levy[]>('/api/levies'),
      fetchJson<EstateMeta>('/api/residents/estate'),
    ])
    setLevies(leviesRes.data ?? [])
    const m = metaRes.data
    setMeta(m ?? null)
    if (m?.estate) {
      setBankName(m.estate.duesBankName ?? '')
      setAccountNo(m.estate.duesAccountNumber ?? '')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveBankDetails(e: React.FormEvent) {
    e.preventDefault()
    setSavingBank(true)
    const { error } = await fetchJson('/api/residents/estate', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duesBankName: bankName, duesAccountNumber: accountNo }),
    })
    setSavingBank(false)
    if (error) {
      setToast({ message: error, variant: 'error' })
      return
    }
    load()
  }

  async function executeDelete(id: string) {
    setDeleting(id)
    await fetchJson(`/api/levies/${id}`, { method: 'DELETE' })
    setDeleting(null)
    setDeleteConfirmId(null)
    load()
  }

  const residentCount = meta?.residentCount ?? 0
  // Estate-wide (admins): use billed units per levy (invoice rows), not active-resident count — avoids 0 when counts disagree.
  const adminTotalExpected = levies.reduce((s, l) => s + l.amount * l._count.total, 0)
  const adminTotalCollected = levies.reduce((s, l) => s + l.amountCollected, 0)
  const adminOutstanding = adminTotalExpected - adminTotalCollected
  // Personal (residents & non–estate-admin roles)
  // Total = sum of every levy amount. Outstanding = total − paid (matches estate levy totals vs your payments).
  const myTotalAllLevies = levies.reduce((s, l) => s + l.amount, 0)
  const myTotalPaid = levies.reduce((s, l) => s + l.amountCollected, 0)
  const myOutstanding = Math.max(0, myTotalAllLevies - myTotalPaid)
  /** Levies where you still owe (shortfall on that levy). */
  function levyShortfall(l: Levy) {
    return Math.max(0, l.amount - l.amountCollected)
  }
  /** Levy due date is today or already passed (calendar day, local). */
  function levyDueDateIsPastOrToday(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    d.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    return d.getTime() <= today.getTime()
  }
  /** Unique calendar months for unpaid levies whose due date has arrived (not future-only). */
  const unpaidDueMonths = (() => {
    const byKey = new Map<string, string>()
    for (const l of levies) {
      if (levyShortfall(l) <= 0.0001) continue
      if (!levyDueDateIsPastOrToday(l.dueDate)) continue
      const d = new Date(l.dueDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!byKey.has(key)) {
        byKey.set(
          key,
          d.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
        )
      }
    }
    return [...byKey.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, label]) => label)
  })()

  const hasAnyShortfall     = levies.some(l => levyShortfall(l) > 0.0001)
  const dueMonthsEmptySub = !hasAnyShortfall
    ? 'No unpaid levy balance'
    : unpaidDueMonths.length === 0
      ? 'No months due yet — levy due dates are still in the future'
      : 'By each levy’s due date · missed, omitted, or partial'

  function fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 0 })
  }

  function isOverdue(dueDate: string) {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* Summary cards */}
      <div
        className={cn(
          'grid gap-4',
          isAdmin ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        )}
      >
        {(isAdmin
          ? [
              { label: 'Total dues expected', value: fmt(adminTotalExpected), icon: CreditCard,   color: 'bg-brand-50   text-brand-600', sub: `${residentCount} active residents · per-unit levy invoices` },
              { label: 'Total collected',     value: fmt(adminTotalCollected), icon: CheckCircle2, color: 'bg-green-50  text-green-600',  sub: undefined },
              { label: 'Outstanding',         value: fmt(adminOutstanding),    icon: Clock,        color: 'bg-amber-50  text-amber-600',  sub: undefined },
            ]
          : [
              { label: 'Total levy amounts', value: fmt(myTotalAllLevies), icon: CreditCard,   color: 'bg-brand-50   text-brand-600', sub: 'All levies created for the estate' },
              { label: 'Total paid',         value: fmt(myTotalPaid),     icon: CheckCircle2, color: 'bg-green-50  text-green-600',  sub: undefined },
              { label: 'Outstanding',        value: fmt(myOutstanding), icon: Clock,        color: 'bg-amber-50  text-amber-600', sub: 'Total levy amounts − total paid' },
              {
                label: 'Due months (unpaid)',
                value: unpaidDueMonths.length > 0 ? unpaidDueMonths.join(', ') : '—',
                icon:  CalendarDays,
                color: 'bg-purple-50 text-purple-600',
                sub:   dueMonthsEmptySub,
                valueClassName: 'text-base font-semibold leading-snug',
              },
            ]
        ).map(({ label, value, icon: Icon, color, sub, valueClassName }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-5 flex items-start gap-4">
            <div className={cn('rounded p-2.5 shrink-0', color)}>
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn('font-semibold text-gray-900 break-words', valueClassName ?? 'text-xl')}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              {sub && (
                <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-gray-50 text-gray-600">
              <Building2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Bank account for levy transfers</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Residents see these details when they pay by bank transfer.
              </p>
              <form onSubmit={saveBankDetails} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Bank name</label>
                  <input
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. GTBank"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Account number</label>
                  <input
                    value={accountNo}
                    onChange={e => setAccountNo(e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="10 digits"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={savingBank}
                    className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {savingBank ? 'Saving…' : 'Save bank details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {levies.length} {levies.length === 1 ? 'levy' : 'levies'} total
        </p>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={15} /> Create levy
          </button>
        )}
      </div>

      {/* Empty state */}
      {!loading && levies.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <CreditCard size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No levies yet</p>
          <p className="text-gray-400 text-xs mt-1">
            {isAdmin
              ? 'Create your first levy to start collecting dues from residents.'
              : 'No levies have been created by your estate admin yet.'
            }
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      )}

      {/* Levy cards */}
      {!loading && (
        <div className="space-y-3">
          {levies.map(levy => {
            const paidPercent = isAdmin
              ? (levy._count.total > 0
                ? Math.round((levy._count.paid / levy._count.total) * 100)
                : 0)
              : (levy._count.paid > 0 ? 100 : 0)
            const overdue = isOverdue(levy.dueDate) && levy._count.pending > 0

            return (
              <div
                key={levy.id}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:border-brand-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedLevy(levy)}
                    className="flex items-start gap-4 flex-1 min-w-0 text-left rounded-lg -m-1 p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    aria-label={`View details for ${levy.title}`}
                  >
                  <div className={cn(
                    'rounded-xl p-2.5 shrink-0',
                    overdue ? 'bg-red-50 text-red-500' : 'bg-brand-50 text-brand-600'
                  )}>
                    <TrendingUp size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm">{levy.title}</h3>
                          {overdue && (
                            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                              Overdue
                            </span>
                          )}
                        </div>
                        {levy.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{levy.description}</p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-gray-900 shrink-0">
                        {fmt(levy.amount)}
                      </p>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>
                          {isAdmin
                            ? `${levy._count.paid} of ${levy._count.total} units paid`
                            : levy._count.total === 0
                              ? 'No payment assigned'
                              : levy._count.paid > 0
                                ? 'Your payment: paid'
                                : 'Your payment: pending'}
                        </span>
                        <span>{paidPercent}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            paidPercent === 100 ? 'bg-green-500' : overdue ? 'bg-red-400' : 'bg-brand-500'
                          )}
                          style={{ width: `${paidPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>
                        Due: {new Date(levy.dueDate).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                      <span>
                        {isAdmin ? `${fmt(levy.amountCollected)} collected` : `${fmt(levy.amountCollected)} paid by you`}
                      </span>
                    </div>
                  </div>

                  <span className="self-center text-sm font-medium text-brand-600 shrink-0">
                    View details
                  </span>
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0 self-start pt-0.5">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setDeleteConfirmId(levy.id) }}
                        disabled={deleting === levy.id}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 border border-transparent hover:border-red-100"
                        title="Delete levy"
                        aria-label={`Delete levy ${levy.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && isAdmin && (
        <CreateLevyModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); load() }}
        />
      )}

      {selectedLevy && (
        <LevyDetailModal
          levy={selectedLevy}
          onClose={() => setSelectedLevy(null)}
        />
      )}

      <DashboardConfirmDialog
        open={deleteConfirmId !== null}
        title="Delete levy"
        description="This removes the levy and all payment records tied to it. This cannot be undone."
        confirmLabel="Delete levy"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteConfirmId !== null && deleting === deleteConfirmId}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) void executeDelete(deleteConfirmId)
        }}
      />

      <DashboardToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}