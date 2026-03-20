'use client'
import { useEffect, useState } from 'react'
import { Plus, Wrench, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import SubmitRequestModal from './SubmitRequestModal'
import RequestDetailModal from './RequestDetailModal'

type Status   = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  category: string
  priority: Priority
  status: Status
  mediaUrls: string[]
  submittedBy: string
  assignedTo: string | null
  createdAt: string
  updatedAt: string
}

const STATUS_COLUMNS: { key: Status; label: string; icon: any; color: string; bg: string }[] = [
  { key: 'OPEN',        label: 'Open',        icon: Clock,        color: 'text-brand-600',  bg: 'bg-brand-50'   },
  { key: 'ASSIGNED',    label: 'Assigned',    icon: Wrench,       color: 'text-purple-600',bg: 'bg-purple-50' },
  { key: 'IN_PROGRESS', label: 'In progress', icon: AlertTriangle,color: 'text-amber-600', bg: 'bg-amber-50'  },
  { key: 'RESOLVED',    label: 'Resolved',    icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50'  },
]

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW:       'bg-gray-100   text-gray-600',
  MEDIUM:    'bg-brand-50    text-brand-700',
  HIGH:      'bg-amber-50   text-amber-700',
  EMERGENCY: 'bg-red-50     text-red-700',
}

const PRIORITY_DOT: Record<Priority, string> = {
  LOW:       'bg-gray-400',
  MEDIUM:    'bg-brand-500',
  HIGH:      'bg-amber-500',
  EMERGENCY: 'bg-red-500',
}

export default function MaintenanceClient() {
  const [requests, setRequests]         = useState<MaintenanceRequest[]>([])
  const [loading, setLoading]           = useState(true)
  const [showSubmit, setShowSubmit]     = useState(false)
  const [selected, setSelected]         = useState<MaintenanceRequest | null>(null)
  const [view, setView]                 = useState<'kanban' | 'list'>('kanban')

  async function load() {
    setLoading(true)
    const { data } = await fetchJson<MaintenanceRequest[]>('/api/maintenance')
    setRequests(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const byStatus = (status: Status) => requests.filter(r => r.status === status)

  const stats = [
    { label: 'Open',        value: byStatus('OPEN').length,        color: 'text-brand-600'   },
    { label: 'In progress', value: byStatus('IN_PROGRESS').length, color: 'text-amber-600'  },
    { label: 'Resolved',    value: byStatus('RESOLVED').length,    color: 'text-green-600'  },
    { label: 'Total',       value: requests.length,                color: 'text-gray-900'   },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Sub-header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">

        {/* Stats */}
        <div className="flex items-center gap-6">
          {stats.map(({ label, value, color }) => (
            <div key={label}>
              <span className={cn('text-xl font-semibold', color)}>{value}</span>
              <span className="text-xs text-gray-400 ml-1.5">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-xs">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'px-3 py-1.5 transition-colors',
                view === 'kanban' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-1.5 transition-colors',
                view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              List
            </button>
          </div>

          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={15} /> New request
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">

        {loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        )}

        {/* ── KANBAN VIEW ── */}
        {!loading && view === 'kanban' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
            {STATUS_COLUMNS.map(({ key, label, icon: Icon, color, bg }) => {
              const col = byStatus(key)
              return (
                <div key={key} className="flex flex-col gap-3 min-w-0">
                  {/* Column header */}
                  <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', bg)}>
                    <Icon size={14} className={color} />
                    <span className={cn('text-xs font-semibold', color)}>{label}</span>
                    <span className={cn(
                      'ml-auto text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center',
                      bg, color
                    )}>
                      {col.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2 flex-1">
                    {col.length === 0 && (
                      <div className="border-2 border-dashed border-gray-100 rounded-xl p-6 text-center">
                        <p className="text-xs text-gray-300">No requests</p>
                      </div>
                    )}
                    {col.map(r => (
                      <RequestCard
                        key={r.id}
                        request={r}
                        onClick={() => setSelected(r)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {!loading && view === 'list' && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {requests.length === 0 ? (
              <div className="py-16 text-center">
                <Wrench size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No maintenance requests yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Title', 'Category', 'Priority', 'Status', 'Submitted', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                      <td className="px-4 py-3 text-gray-500">{r.category}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                          PRIORITY_STYLES[r.priority]
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_DOT[r.priority])} />
                          {r.priority.charAt(0) + r.priority.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">→</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showSubmit && (
        <SubmitRequestModal
          onClose={() => setShowSubmit(false)}
          onSuccess={() => { setShowSubmit(false); load() }}
        />
      )}

      {selected && (
        <RequestDetailModal
          request={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => { setSelected(null); load() }}
        />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────

function RequestCard({
  request: r,
  onClick,
}: {
  request: MaintenanceRequest
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-snug">{r.title}</p>
        <span className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium shrink-0',
          PRIORITY_STYLES[r.priority]
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_DOT[r.priority])} />
          {r.priority.charAt(0) + r.priority.slice(1).toLowerCase()}
        </span>
      </div>

      <p className="text-xs text-gray-400 line-clamp-2">{r.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
          {r.category}
        </span>
        <span className="text-xs text-gray-300">
          {new Date(r.createdAt).toLocaleDateString('en-NG', {
            day: 'numeric', month: 'short',
          })}
        </span>
      </div>

      {r.mediaUrls.length > 0 && (
        <p className="text-xs text-blue-500">{r.mediaUrls.length} attachment{r.mediaUrls.length > 1 ? 's' : ''}</p>
      )}
    </button>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; className: string }> = {
    OPEN:        { label: 'Open',        className: 'bg-brand-50   text-brand-700'   },
    ASSIGNED:    { label: 'Assigned',    className: 'bg-purple-50 text-purple-700' },
    IN_PROGRESS: { label: 'In progress', className: 'bg-amber-50  text-amber-700'  },
    RESOLVED:    { label: 'Resolved',    className: 'bg-green-50  text-green-700'  },
    CLOSED:      { label: 'Closed',      className: 'bg-gray-100  text-gray-500'   },
  }
  const { label, className } = map[status] ?? map.OPEN
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  )
}