'use client'
import { useState } from 'react'
import { X, Loader2, CalendarCheck, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: string
  resident: { firstName: string; lastName: string }
}

interface Facility {
  id: string
  name: string
  description: string | null
  capacity: number | null
  feePerSlot: number
  bookings: Booking[]
}

interface Props {
  facility: Facility
  onClose: () => void
  onSuccess: () => void
}

export default function BookFacilityModal({ facility, onClose, onSuccess }: Props) {
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16)

  const [form, setForm] = useState({ startTime: '', endTime: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(p => ({ ...p, [key]: e.target.value }))
      setError('')
    }
  }

  // Duration in hours for display
  function duration() {
    if (!form.startTime || !form.endTime) return null
    const diff = (new Date(form.endTime).getTime() - new Date(form.startTime).getTime()) / 3600000
    if (diff <= 0) return null
    return diff < 1 ? `${diff * 60} min` : `${diff} hr${diff !== 1 ? 's' : ''}`
  }

  const totalFee = facility.feePerSlot > 0 && duration()
    ? facility.feePerSlot
    : 0

  // Check if chosen slot overlaps any existing booking
  function hasConflict() {
    if (!form.startTime || !form.endTime) return false
    const start = new Date(form.startTime)
    const end   = new Date(form.endTime)
    return facility.bookings.some(b => {
      if (b.status === 'CANCELLED') return false
      const bs = new Date(b.startTime)
      const be = new Date(b.endTime)
      return start < be && end > bs
    })
  }

  const conflict = hasConflict()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (conflict) return
    setLoading(true)
    setError('')

    const { error } = await fetchJson(`/api/facilities/${facility.id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (error) { setError(error); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => onSuccess(), 1500)
  }

  const upcomingBookings = facility.bookings
    .filter(b => b.status === 'CONFIRMED' && new Date(b.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5)

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <CalendarCheck size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Book {facility.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CalendarCheck size={24} className="text-green-600" />
              </div>
              <p className="font-semibold text-gray-900">Booking confirmed!</p>
              <p className="text-sm text-gray-500">Your slot has been reserved.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={set('startTime')}
                      min={nowLocal} required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={set('endTime')}
                      min={form.startTime || nowLocal} required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  </div>
                </div>

                {/* Conflict warning */}
                {conflict && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    This time slot overlaps an existing booking. Please choose a different time.
                  </div>
                )}

                {/* Booking summary */}
                {duration() && !conflict && (
                  <div className="bg-brand-50 rounded-lg px-4 py-3 space-y-1 text-xs text-brand-700">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><Clock size={11} /> Duration</span>
                      <span className="font-medium">{duration()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fee</span>
                      <span className="font-medium">
                        {totalFee === 0 ? 'Free' : '₦' + totalFee.toLocaleString('en-NG')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button" onClick={onClose}
                    className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !form.startTime || !form.endTime || conflict}
                    className="flex-1 bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><Loader2 size={14} className="animate-spin" /> Booking...</>
                      : 'Confirm booking'
                    }
                  </button>
                </div>
              </form>

              {/* Existing bookings for this facility */}
              {upcomingBookings.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Upcoming bookings for {facility.name}
                  </p>
                  <div className="space-y-1.5">
                    {upcomingBookings.map(b => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs"
                      >
                        <span className="text-gray-600">
                          {b.resident.firstName} {b.resident.lastName}
                        </span>
                        <span className="text-gray-400">
                          {new Date(b.startTime).toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short',
                          })} · {new Date(b.startTime).toLocaleTimeString('en-NG', {
                            hour: '2-digit', minute: '2-digit',
                          })} – {new Date(b.endTime).toLocaleTimeString('en-NG', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}