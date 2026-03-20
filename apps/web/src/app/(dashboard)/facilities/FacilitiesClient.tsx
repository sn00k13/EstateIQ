'use client'
import { useEffect, useState } from 'react'
import { Plus, CalendarCheck, Users, Banknote, Trash2, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import AddFacilityModal from './AddFacilityModal'
import BookFacilityModal from './BookFacilityModal'
import MyBookingsPanel from './MyBookingsPanel'
import { useResident } from '@/context/ResidentContext'

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

export default function FacilitiesClient() {
  const { isAdmin }                             = useResident()
  const [facilities, setFacilities]             = useState<Facility[]>([])
  const [loading, setLoading]                   = useState(true)
  const [showAdd, setShowAdd]                   = useState(false)
  const [showMyBookings, setShowMyBookings]     = useState(false)
  const [booking, setBooking]                   = useState<Facility | null>(null)
  const [deleting, setDeleting]                 = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await fetchJson<Facility[]>('/api/facilities')
    setFacilities(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this facility and all its bookings?')) return
    setDeleting(id)
    await fetchJson(`/api/facilities/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  function fmt(n: number) {
    return n === 0 ? 'Free' : '₦' + n.toLocaleString('en-NG')
  }

  function nextSlot(bookings: Booking[]) {
    const upcoming = bookings
      .filter(b => b.status === 'CONFIRMED' && new Date(b.startTime) > new Date())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    return upcoming[0] ?? null
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          {facilities.length} {facilities.length === 1 ? 'facility' : 'facilities'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMyBookings(true)}
            className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <BookOpen size={15} /> My bookings
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <Plus size={15} /> Add facility
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!loading && facilities.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-16 text-center">
          <CalendarCheck size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No facilities yet</p>
          <p className="text-gray-400 text-xs mt-1">
            {isAdmin
              ? 'Add facilities like the pool, gym, or clubhouse for residents to book.'
              : 'No facilities have been added by your estate admin yet.'
            }
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse h-48" />
          ))}
        </div>
      )}

      {/* Facility cards */}
      {!loading && facilities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map(f => {
            const upcoming   = nextSlot(f.bookings)
            const bookedCount = f.bookings.filter(b => b.status === 'CONFIRMED').length

            return (
              <div
                key={f.id}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all flex flex-col"
              >
                <div className="bg-brand-600 px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-base">{f.name}</h3>
                      {f.description && (
                        <p className="text-blue-100 text-xs mt-0.5 line-clamp-1">{f.description}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={deleting === f.id}
                        className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-brand-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    {f.capacity && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Users size={14} />
                        <span className="text-xs">{f.capacity} capacity</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Banknote size={14} />
                      <span className="text-xs">{fmt(f.feePerSlot)} / slot</span>
                    </div>
                  </div>

                  {bookedCount > 0 ? (
                    <div className="bg-amber-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-amber-700 font-medium">
                        {bookedCount} upcoming booking{bookedCount > 1 ? 's' : ''}
                      </p>
                      {upcoming && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          Next: {new Date(upcoming.startTime).toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short',
                          })} · {upcoming.resident.firstName} {upcoming.resident.lastName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-green-700 font-medium">Available — no upcoming bookings</p>
                    </div>
                  )}
                </div>

                <div className="px-5 pb-5">
                  <button
                    onClick={() => setBooking(f)}
                    className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CalendarCheck size={14} /> Book this facility
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && isAdmin && (
        <AddFacilityModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); load() }}
        />
      )}

      {booking && (
        <BookFacilityModal
          facility={booking}
          onClose={() => setBooking(null)}
          onSuccess={() => { setBooking(null); load() }}
        />
      )}

      {showMyBookings && (
        <MyBookingsPanel onClose={() => setShowMyBookings(false)} />
      )}
    </div>
  )
}