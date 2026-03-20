'use client'
import { useEffect, useState } from 'react'
import { Plus, Megaphone, Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import AnnouncementModal from './AnnouncementModal'
import { useResident } from '@/context/ResidentContext'

type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

interface Announcement {
  id: string
  title: string
  body: string
  priority: Priority
  createdAt: string
}

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW:    'bg-gray-100    text-gray-600',
  NORMAL: 'bg-brand-50    text-brand-700',
  HIGH:   'bg-amber-50   text-amber-700',
  URGENT: 'bg-red-50     text-red-700',
}

const PRIORITY_DOT: Record<Priority, string> = {
  LOW:    'bg-gray-400',
  NORMAL: 'bg-brand-500',
  HIGH:   'bg-amber-500',
  URGENT: 'bg-red-500',
}

export default function AnnouncementsClient() {
  const { isAdmin }                               = useResident()
  const [announcements, setAnnouncements]         = useState<Announcement[]>([])
  const [loading, setLoading]                     = useState(true)
  const [showModal, setShowModal]                 = useState(false)
  const [editing, setEditing]                     = useState<Announcement | null>(null)
  const [expanded, setExpanded]                   = useState<string | null>(null)
  const [filterPriority, setFilterPriority]       = useState<Priority | 'ALL'>('ALL')
  const [deleting, setDeleting]                   = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await fetchJson<Announcement[]>('/api/announcements')
    setAnnouncements(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement? This cannot be undone.')) return
    setDeleting(id)
    await fetchJson(`/api/announcements/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const filtered = filterPriority === 'ALL'
    ? announcements
    : announcements.filter(a => a.priority === filterPriority)

  const counts = {
    ALL:    announcements.length,
    URGENT: announcements.filter(a => a.priority === 'URGENT').length,
    HIGH:   announcements.filter(a => a.priority === 'HIGH').length,
    NORMAL: announcements.filter(a => a.priority === 'NORMAL').length,
    LOW:    announcements.filter(a => a.priority === 'LOW').length,
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(['ALL', 'URGENT', 'HIGH', 'NORMAL', 'LOW'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                filterPriority === p
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              {p === 'ALL' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
              <span className={cn(
                'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                filterPriority === p ? 'bg-white/20' : 'bg-gray-100'
              )}>
                {counts[p]}
              </span>
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={15} /> New announcement
          </button>
        )}
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <Megaphone size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No announcements yet</p>
          <p className="text-gray-400 text-xs mt-1">
            {filterPriority !== 'ALL'
              ? `No ${filterPriority.toLowerCase()} priority announcements.`
              : isAdmin
              ? 'Create your first announcement to notify residents.'
              : 'No announcements from your estate admin yet.'
            }
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Announcement cards */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map(a => {
            const isExpanded = expanded === a.id
            const isLong     = a.body.length > 160

            return (
              <div
                key={a.id}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors"
              >
                <div className={cn(
                  'h-1',
                  a.priority === 'URGENT' ? 'bg-red-500' :
                  a.priority === 'HIGH'   ? 'bg-amber-400' :
                  a.priority === 'NORMAL' ? 'bg-blue-400' : 'bg-gray-200'
                )} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                          PRIORITY_STYLES[a.priority]
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_DOT[a.priority])} />
                          {a.priority.charAt(0) + a.priority.slice(1).toLowerCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(a.createdAt).toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{a.title}</h3>

                      <p className={cn(
                        'text-sm text-gray-600 leading-relaxed',
                        !isExpanded && isLong && 'line-clamp-2'
                      )}>
                        {a.body}
                      </p>

                      {isLong && (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : a.id)}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-1.5 font-medium"
                        >
                          {isExpanded
                            ? <><ChevronUp size={12} /> Show less</>
                            : <><ChevronDown size={12} /> Read more</>
                          }
                        </button>
                      )}
                    </div>

                    {/* Admin-only actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setEditing(a); setShowModal(true) }}
                          className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deleting === a.id}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && isAdmin && (
        <AnnouncementModal
          existing={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSuccess={() => { setShowModal(false); setEditing(null); load() }}
        />
      )}
    </div>
  )
}