'use client'
import { useEffect, useState } from 'react'
import {
  Plus, AlertTriangle, CheckCircle2,
  Clock, Search, Trash2, Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import ReportIncidentModal from './ReportIncidentModal'
import IncidentDetailModal from './IncidentDetailModal'

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface Incident {
  id: string
  title: string
  description: string
  severity: Severity
  location: string | null
  mediaUrls: string[]
  reportedBy: string
  resolvedAt: string | null
  createdAt: string
}

const SEVERITY_STYLES: Record<Severity, { badge: string; dot: string; bar: string }> = {
  LOW:      { badge: 'bg-gray-100   text-gray-600',   dot: 'bg-gray-400',   bar: 'bg-gray-300'   },
  MEDIUM:   { badge: 'bg-amber-50   text-amber-700',  dot: 'bg-amber-500',  bar: 'bg-amber-400'  },
  HIGH:     { badge: 'bg-orange-50  text-orange-700', dot: 'bg-orange-500', bar: 'bg-orange-400' },
  CRITICAL: { badge: 'bg-red-50     text-red-700',    dot: 'bg-red-500',    bar: 'bg-red-500'    },
}

export default function IncidentsClient() {
  const [incidents, setIncidents]     = useState<Incident[]>([])
  const [filtered, setFiltered]       = useState<Incident[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter]     = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL')
  const [showReport, setShowReport]   = useState(false)
  const [selected, setSelected]       = useState<Incident | null>(null)
  const [deleting, setDeleting]       = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await fetchJson<Incident[]>('/api/incidents')
    setIncidents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      incidents.filter(inc => {
        const matchSearch   = `${inc.title} ${inc.description} ${inc.location ?? ''}`.toLowerCase().includes(q)
        const matchSeverity = severityFilter === 'ALL' || inc.severity === severityFilter
        const matchStatus   =
          statusFilter === 'ALL'      ? true :
          statusFilter === 'OPEN'     ? !inc.resolvedAt :
          statusFilter === 'RESOLVED' ? !!inc.resolvedAt : true
        return matchSearch && matchSeverity && matchStatus
      })
    )
  }, [incidents, search, severityFilter, statusFilter])

  async function handleDelete(id: string) {
    if (!confirm('Delete this incident report? This cannot be undone.')) return
    setDeleting(id)
    await fetchJson(`/api/incidents/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  async function handleResolve(id: string) {
    await fetchJson(`/api/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolvedAt: new Date().toISOString() }),
    })
    load()
  }

  const open     = incidents.filter(i => !i.resolvedAt).length
  const resolved = incidents.filter(i =>  i.resolvedAt).length
  const critical = incidents.filter(i => i.severity === 'CRITICAL' && !i.resolvedAt).length

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total incidents', value: incidents.length, color: 'text-gray-900',  bg: 'bg-white border border-gray-100'  },
          { label: 'Open',            value: open,             color: 'text-amber-600', bg: 'bg-amber-50'                      },
          { label: 'Critical open',   value: critical,         color: 'text-red-600',   bg: 'bg-red-50'                        },
          { label: 'Resolved',        value: resolved,         color: 'text-green-600', bg: 'bg-green-50'                      },
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
            placeholder="Search incidents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm focus:outline-none bg-transparent"
          />
        </div>
        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Plus size={15} /> Report incident
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status filter */}
        {(['ALL', 'OPEN', 'RESOLVED'] as const).map(s => (
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
            {s === 'ALL' ? 'All status' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}

        <div className="w-px h-4 bg-gray-200" />

        {/* Severity filter */}
        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
              severityFilter === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            )}
          >
            {s === 'ALL' ? 'All severity' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-16 text-center">
          <AlertTriangle size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No incidents found</p>
          <p className="text-gray-400 text-xs mt-1">
            {search || severityFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting your filters.'
              : 'No security incidents have been reported yet.'}
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse h-28" />
          ))}
        </div>
      )}

      {/* Incident cards */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map(inc => {
            const styles    = SEVERITY_STYLES[inc.severity]
            const isResolved = !!inc.resolvedAt

            return (
              <div
                key={inc.id}
                className={cn(
                  'bg-white border rounded-xl overflow-hidden hover:border-gray-200 transition-colors',
                  isResolved ? 'border-gray-100 opacity-75' : 'border-gray-200'
                )}
              >
                {/* Severity bar */}
                <div className={cn('h-1', styles.bar)} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">

                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-semibold text-gray-900 text-sm">{inc.title}</h3>

                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                          styles.badge
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
                          {inc.severity.charAt(0) + inc.severity.slice(1).toLowerCase()}
                        </span>

                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={10} /> Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Clock size={10} /> Open
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-500 line-clamp-2">{inc.description}</p>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        {inc.location && (
                          <span>📍 {inc.location}</span>
                        )}
                        <span>
                          Reported: {new Date(inc.createdAt).toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        {inc.resolvedAt && (
                          <span className="text-green-600">
                            Resolved: {new Date(inc.resolvedAt).toLocaleDateString('en-NG', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setSelected(inc)}
                        className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                      {!isResolved && (
                        <button
                          onClick={() => handleResolve(inc.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Mark as resolved"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(inc.id)}
                        disabled={deleting === inc.id}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showReport && (
        <ReportIncidentModal
          onClose={() => setShowReport(false)}
          onSuccess={() => { setShowReport(false); load() }}
        />
      )}

      {selected && (
        <IncidentDetailModal
          incident={selected}
          onClose={() => setSelected(null)}
          onResolve={() => { handleResolve(selected.id); setSelected(null) }}
          onDelete={() => { handleDelete(selected.id); setSelected(null) }}
        />
      )}
    </div>
  )
}