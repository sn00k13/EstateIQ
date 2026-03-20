'use client'
import { X, AlertTriangle, MapPin, Clock, CheckCircle2, Trash2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface Props {
  incident: Incident
  onClose: () => void
  onResolve: () => void
  onDelete: () => void
}

const SEVERITY_STYLES: Record<Severity, { badge: string; dot: string; bar: string }> = {
  LOW:      { badge: 'bg-gray-100  text-gray-600',   dot: 'bg-gray-400',   bar: 'bg-gray-300'   },
  MEDIUM:   { badge: 'bg-amber-50  text-amber-700',  dot: 'bg-amber-500',  bar: 'bg-amber-400'  },
  HIGH:     { badge: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500', bar: 'bg-orange-400' },
  CRITICAL: { badge: 'bg-red-50    text-red-700',    dot: 'bg-red-500',    bar: 'bg-red-500'    },
}

export default function IncidentDetailModal({ incident, onClose, onResolve, onDelete }: Props) {
  const styles     = SEVERITY_STYLES[incident.severity]
  const isResolved = !!incident.resolvedAt

  const details = [
    {
      icon: AlertTriangle,
      label: 'Severity',
      value: (
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
          styles.badge
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
          {incident.severity.charAt(0) + incident.severity.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      icon: MapPin,
      label: 'Location',
      value: incident.location ?? 'Not specified',
      muted: !incident.location,
    },
    {
      icon: Clock,
      label: 'Reported',
      value: new Date(incident.createdAt).toLocaleDateString('en-NG', {
        weekday: 'long', day: 'numeric', month: 'long',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
    },
    {
      icon: User,
      label: 'Reported by',
      value: 'Resident ID: ' + incident.reportedBy.slice(0, 8) + '...',
    },
    ...(isResolved ? [{
      icon: CheckCircle2,
      label: 'Resolved on',
      value: new Date(incident.resolvedAt!).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'long', year: 'numeric',
      }),
    }] : []),
  ]

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Severity bar */}
        <div className={cn('h-1.5 rounded-t-2xl', styles.bar)} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <h2 className="font-semibold text-gray-900">Incident details</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Title + status */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{incident.title}</h3>
            <span className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
              isResolved
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            )}>
              {isResolved
                ? <><CheckCircle2 size={11} /> Resolved</>
                : <><Clock size={11} /> Open</>
              }
            </span>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
              {incident.description}
            </p>
          </div>

          {/* Detail rows */}
          <div className="space-y-3">
            {details.map(({ icon: Icon, label, value, muted }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  {typeof value === 'string' ? (
                    <p className={cn('text-sm font-medium mt-0.5', muted ? 'text-gray-400' : 'text-gray-800')}>
                      {value}
                    </p>
                  ) : (
                    <div className="mt-0.5">{value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Attachments */}
          {incident.mediaUrls.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Attachments ({incident.mediaUrls.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {incident.mediaUrls.map((url, i) => (
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

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} /> Delete
            </button>

            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Close
            </button>

            {!isResolved && (
              <button
                onClick={onResolve}
                className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} /> Mark resolved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}