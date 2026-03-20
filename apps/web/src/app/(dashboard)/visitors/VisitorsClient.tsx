'use client'
import { useEffect, useState } from 'react'
import {
  Plus, ShieldCheck, Clock, CheckCircle2,
  XCircle, LogOut, Search, QrCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import { useSSE } from '@/hooks/useSSE'
import RegisterVisitorModal from './RegisterVisitorModal'
import GateCheckinPanel from './GateCheckinPanel'
import VisitorToast from './VisitorToast'

type VisitorStatus = 'EXPECTED' | 'ARRIVED' | 'EXITED' | 'CANCELLED'

interface Visitor {
  id: string
  name: string
  phone: string | null
  purpose: string | null
  accessCode: string
  status: VisitorStatus
  expectedAt: string
  arrivedAt: string | null
  exitedAt: string | null
  createdAt: string
  resident: {
    firstName: string
    lastName: string
    unit: { number: string; block: string | null } | null
  }
}

const STATUS_STYLES: Record<VisitorStatus, string> = {
  EXPECTED:  'bg-brand-50  text-brand-700',
  ARRIVED:   'bg-green-50 text-green-700',
  EXITED:    'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-50   text-red-500',
}

const STATUS_ICONS: Record<VisitorStatus, any> = {
  EXPECTED:  Clock,
  ARRIVED:   CheckCircle2,
  EXITED:    LogOut,
  CANCELLED: XCircle,
}

export default function VisitorsClient() {
  const [visitors, setVisitors]           = useState<Visitor[]>([])
  const [filtered, setFiltered]           = useState<Visitor[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState<VisitorStatus | 'ALL'>('ALL')
  const [showRegister, setShowRegister]   = useState(false)
  const [showGate, setShowGate]           = useState(false)
  const [toast, setToast]                 = useState<{ name: string; purpose: string | null } | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await fetchJson<Visitor[]>('/api/visitors')
    setVisitors(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Real-time: when security checks in a visitor, show a toast and refresh the list
  useSSE({
    'visitor-arrived': (data) => {
      setToast({ name: data.visitorName, purpose: data.purpose })
      load()
      setTimeout(() => setToast(null), 6000)
    },
  })

  // Filter by search + status
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      visitors.filter(v => {
        const matchSearch = `${v.name} ${v.phone ?? ''} ${v.accessCode}`.toLowerCase().includes(q)
        const matchStatus = statusFilter === 'ALL' || v.status === statusFilter
        return matchSearch && matchStatus
      })
    )
  }, [visitors, search, statusFilter])

  async function handleCancel(id: string) {
    await fetchJson(`/api/visitors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
    load()
  }

  const counts = {
    ALL:       visitors.length,
    EXPECTED:  visitors.filter(v => v.status === 'EXPECTED').length,
    ARRIVED:   visitors.filter(v => v.status === 'ARRIVED').length,
    EXITED:    visitors.filter(v => v.status === 'EXITED').length,
    CANCELLED: visitors.filter(v => v.status === 'CANCELLED').length,
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* Real-time arrival toast */}
      {toast && (
        <VisitorToast
          name={toast.name}
          purpose={toast.purpose}
          onClose={() => setToast(null)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Expected', value: counts.EXPECTED,  color: 'text-brand-600',  bg: 'bg-brand-50'  },
          { label: 'Arrived',  value: counts.ARRIVED,   color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Exited',   value: counts.EXITED,    color: 'text-gray-600',  bg: 'bg-gray-50'  },
          { label: 'Cancelled',value: counts.CANCELLED, color: 'text-red-500',   bg: 'bg-red-50'   },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl p-4', bg)}>
            <p className={cn('text-2xl font-semibold', color)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or access code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm focus:outline-none bg-transparent"
          />
        </div>

        <button
          onClick={() => setShowGate(true)}
          className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <QrCode size={15} /> Gate check-in
        </button>

        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} /> Register visitor
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'EXPECTED', 'ARRIVED', 'EXITED', 'CANCELLED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
              statusFilter === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            )}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <ShieldCheck size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No visitors found</p>
          <p className="text-gray-400 text-xs mt-1">
            {search || statusFilter !== 'ALL'
              ? 'Try adjusting your search or filter.'
              : 'Register a visitor to generate an access code.'}
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      )}

      {/* Visitor cards */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map(v => {
            const StatusIcon = STATUS_ICONS[v.status]
            return (
              <div
                key={v.id}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm shrink-0">
                      {v.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm">{v.name}</h3>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                          STATUS_STYLES[v.status]
                        )}>
                          <StatusIcon size={10} />
                          {v.status.charAt(0) + v.status.slice(1).toLowerCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
                        {v.purpose && <span>Purpose: {v.purpose}</span>}
                        {v.phone   && <span>{v.phone}</span>}
                        <span>
                          Host: {v.resident.firstName} {v.resident.lastName}
                          {v.resident.unit && (
                            ` — ${v.resident.unit.block ? v.resident.unit.block + ', ' : ''}${v.resident.unit.number}`
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                        <span>
                          Expected: {new Date(v.expectedAt).toLocaleString('en-NG', {
                            day: 'numeric', month: 'short',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        {v.arrivedAt && (
                          <span className="text-green-600">
                            Arrived: {new Date(v.arrivedAt).toLocaleTimeString('en-NG', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        )}
                        {v.exitedAt && (
                          <span>
                            Exited: {new Date(v.exitedAt).toLocaleTimeString('en-NG', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Access code + cancel */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="bg-gray-900 text-white text-lg font-mono font-bold px-3 py-1.5 rounded-lg tracking-widest">
                      {v.accessCode}
                    </div>
                    {v.status === 'EXPECTED' && (
                      <button
                        onClick={() => handleCancel(v.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Cancel visit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showRegister && (
        <RegisterVisitorModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => { setShowRegister(false); load() }}
        />
      )}

      {showGate && (
        <GateCheckinPanel
          onClose={() => setShowGate(false)}
          onCheckin={() => load()}
        />
      )}
    </div>
  )
}