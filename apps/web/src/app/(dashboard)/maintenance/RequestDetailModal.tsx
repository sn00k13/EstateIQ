'use client'
import { useState } from 'react'
import { X, Loader2, Wrench, Calendar, Tag, User, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'

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

interface Props {
  request: MaintenanceRequest
  onClose: () => void
  onUpdate: () => void
}

const STATUS_FLOW: Status[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

const STATUS_STYLES: Record<Status, string> = {
  OPEN:        'bg-brand-50   text-brand-700   border-brand-200',
  ASSIGNED:    'bg-purple-50 text-purple-700 border-purple-200',
  IN_PROGRESS: 'bg-amber-50  text-amber-700  border-amber-200',
  RESOLVED:    'bg-green-50  text-green-700  border-green-200',
  CLOSED:      'bg-gray-100  text-gray-500   border-gray-200',
}

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW:       'bg-gray-100  text-gray-600',
  MEDIUM:    'bg-brand-50   text-brand-700',
  HIGH:      'bg-amber-50  text-amber-700',
  EMERGENCY: 'bg-red-50    text-red-700',
}

const NEXT_STATUS_LABEL: Partial<Record<Status, string>> = {
  OPEN:        'Mark as assigned',
  ASSIGNED:    'Mark as in progress',
  IN_PROGRESS: 'Mark as resolved',
  RESOLVED:    'Close request',
}

export default function RequestDetailModal({ request, onClose, onUpdate }: Props) {
  const [assignedTo, setAssignedTo] = useState(request.assignedTo ?? '')
  const [updating, setUpdating]     = useState(false)
  const [error, setError]           = useState('')

  const currentIndex = STATUS_FLOW.indexOf(request.status)
  const nextStatus   = STATUS_FLOW[currentIndex + 1] as Status | undefined
  const nextLabel    = nextStatus ? NEXT_STATUS_LABEL[request.status] : null

  async function handleStatusAdvance() {
    if (!nextStatus) return
    setUpdating(true)
    setError('')

    const { error } = await fetchJson(`/api/maintenance/${request.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status:     nextStatus,
        assignedTo: assignedTo.trim() || null,
      }),
    })

    setUpdating(false)
    if (error) { setError(error); return }
    onUpdate()
  }

  async function handleSaveAssignee() {
    setUpdating(true)
    const { error } = await fetchJson(`/api/maintenance/${request.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedTo: assignedTo.trim() || null }),
    })
    setUpdating(false)
    if (error) { setError(error); return }
    onUpdate()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Request details</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Title + badges */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{request.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border',
                STATUS_STYLES[request.status]
              )}>
                {request.status.replace('_', ' ').charAt(0) +
                 request.status.replace('_', ' ').slice(1).toLowerCase()}
              </span>
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium',
                PRIORITY_STYLES[request.priority]
              )}>
                {request.priority.charAt(0) + request.priority.slice(1).toLowerCase()} priority
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {request.category}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">
              {request.description}
            </p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Submitted</p>
                <p className="text-sm text-gray-700">
                  {new Date(request.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tag size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Last updated</p>
                <p className="text-sm text-gray-700">
                  {new Date(request.updatedAt).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Assignee field */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Assigned to
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <User size={14} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  placeholder="Enter staff name or ID"
                  className="flex-1 text-sm focus:outline-none bg-transparent"
                />
              </div>
              <button
                onClick={handleSaveAssignee}
                disabled={updating}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors shrink-0"
              >
                Save
              </button>
            </div>
          </div>

          {/* Status progress stepper */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3">Status progress</p>
            <div className="flex items-center gap-1">
              {STATUS_FLOW.filter(s => s !== 'CLOSED').map((s, i) => {
                const stepIndex = STATUS_FLOW.indexOf(s)
                const isDone    = stepIndex < currentIndex
                const isCurrent = stepIndex === currentIndex
                return (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div className={cn(
                      'flex-1 h-1.5 rounded-full transition-colors',
                      isDone    ? 'bg-brand-500' :
                      isCurrent ? 'bg-blue-300' : 'bg-gray-100'
                    )} />
                    {i < STATUS_FLOW.filter(s => s !== 'CLOSED').length - 1 && (
                      <ArrowRight size={10} className="text-gray-300 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-1">
              {STATUS_FLOW.filter(s => s !== 'CLOSED').map(s => (
                <span key={s} className={cn(
                  'text-xs',
                  s === request.status ? 'text-brand-600 font-medium' : 'text-gray-300'
                )}>
                  {s === 'IN_PROGRESS' ? 'In progress' : s.charAt(0) + s.slice(1).toLowerCase()}
                </span>
              ))}
            </div>
          </div>

          {/* Attachments */}
          {request.mediaUrls.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Attachments ({request.mediaUrls.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {request.mediaUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-600 underline hover:text-brand-700"
                  >
                    Attachment {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Close
            </button>
            {nextLabel && (
              <button
                onClick={handleStatusAdvance}
                disabled={updating}
                className="flex-1 bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating
                  ? <><Loader2 size={14} className="animate-spin" /> Updating...</>
                  : nextLabel
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
