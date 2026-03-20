'use client'
import { useEffect, useState } from 'react'
import { Plus, CreditCard, Trash2, Eye, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import CreateLevyModal from './CreateLevyModal'
import LevyDetailModal from './LevyDetailModal'
import { useResident } from '@/context/ResidentContext'

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
}

export default function LeviesClient() {
  const { isAdmin }                           = useResident()
  const [levies, setLevies]                   = useState<Levy[]>([])
  const [loading, setLoading]                 = useState(true)
  const [showCreate, setShowCreate]           = useState(false)
  const [selectedLevy, setSelectedLevy]       = useState<Levy | null>(null)
  const [deleting, setDeleting]               = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await fetchJson<Levy[]>('/api/levies')
    setLevies(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this levy and all its payment records? This cannot be undone.')) return
    setDeleting(id)
    await fetchJson(`/api/levies/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const totalExpected  = levies.reduce((s, l) => s + l.amount * l._count.total, 0)
  const totalCollected = levies.reduce((s, l) => s + l.amountCollected, 0)
  const totalPending   = totalExpected - totalCollected

  function fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 0 })
  }

  function isOverdue(dueDate: string) {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total expected',  value: fmt(totalExpected),  icon: CreditCard,   color: 'bg-brand-50   text-brand-600'  },
          { label: 'Total collected', value: fmt(totalCollected), icon: CheckCircle2, color: 'bg-green-50  text-green-600' },
          { label: 'Outstanding',     value: fmt(totalPending),   icon: Clock,        color: 'bg-amber-50  text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4">
            <div className={cn('rounded-lg p-2.5', color)}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {levies.length} {levies.length === 1 ? 'levy' : 'levies'} total
        </p>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
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
            const paidPercent = levy._count.total > 0
              ? Math.round((levy._count.paid / levy._count.total) * 100)
              : 0
            const overdue = isOverdue(levy.dueDate) && levy._count.pending > 0

            return (
              <div
                key={levy.id}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start gap-4">
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
                        <span>{levy._count.paid} of {levy._count.total} units paid</span>
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
                      <span>{fmt(levy.amountCollected)} collected</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectedLevy(levy)}
                      className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      title="View payments"
                    >
                      <Eye size={14} />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(levy.id)}
                        disabled={deleting === levy.id}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Delete levy"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
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
    </div>
  )
}