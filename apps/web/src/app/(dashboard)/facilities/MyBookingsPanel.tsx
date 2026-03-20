'use client'
import { useEffect, useState } from 'react'
import { X, CalendarCheck, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'

interface MyBooking {
  id: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  facility: { name: string; description: string | null }
}

interface Props { onClose: () => void }

const STATUS_STYLES = {
  CONFIRMED: 'bg-green-50 text-green-700',
  PENDING:   'bg-brand-50  text-brand-700',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

const STATUS_ICONS = {
  CONFIRMED: CheckCircle2,
  PENDING:   Clock,
  CANCELLED: XCircle,
}

export default function MyBookingsPanel({ onClose }: Props) {
  const [bookings, setBookings]   = useState<MyBooking[]>([])
  const [loading, setLoading]     = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await fetchJson<MyBooking[]>('/api/facilities/bookings/mine')
    setBookings(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCancel(id: string) {
    setCancelling(id)
    await fetchJson(`/api/facilities/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    })
    setCancelling(null)
    load()
  }

  const upcoming = bookings.filter(b =>
    b.status !== 'CANCELLED' && new Date(b.endTime) > new Date()
  )
  const past = bookings.filter(b =>
    b.status === 'CANCELLED' || new Date(b.endTime) <= new Date()
  )

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <CalendarCheck size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">My bookings</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={22} className="animate-spin text-gray-400" />
            </div>
          )}

          {!loading && bookings.length === 0 && (
            <div className="py-12 text-center">
              <CalendarCheck size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No bookings yet.</p>
            </div>
          )}

          {!loading && upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Upcoming
              </p>
              <div className="space-y-2">
                {upcoming.map(b => {
                  const StatusIcon = STATUS_ICONS[b.status]
                  return (
                    <div
                      key={b.id}
                      className="border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 text-sm">{b.facility.name}</p>
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            STATUS_STYLES[b.status]
                          )}>
                            <StatusIcon size={10} />
                            {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(b.startTime).toLocaleDateString('en-NG', {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })} · {new Date(b.startTime).toLocaleTimeString('en-NG', {
                            hour: '2-digit', minute: '2-digit',
                          })} — {new Date(b.endTime).toLocaleTimeString('en-NG', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancelling === b.id}
                        className="text-xs text-red-400 hover:text-red-600 shrink-0 disabled:opacity-50"
                      >
                        {cancelling === b.id ? <Loader2 size={12} className="animate-spin" /> : 'Cancel'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!loading && past.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Past & cancelled
              </p>
              <div className="space-y-2">
                {past.map(b => {
                  const StatusIcon = STATUS_ICONS[b.status]
                  return (
                    <div
                      key={b.id}
                      className="border border-gray-50 rounded-xl p-4 opacity-60"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-700 text-sm">{b.facility.name}</p>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                          STATUS_STYLES[b.status]
                        )}>
                          <StatusIcon size={10} />
                          {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(b.startTime).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}