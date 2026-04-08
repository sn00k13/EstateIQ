'use client'
import { useEffect, useState } from 'react'
import { Plus, Car, Search, QrCode, Trash2, RotateCcw, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import { useResident } from '@/context/ResidentContext'
import RegisterVehicleModal from './RegisterVehicleModal'
import VehicleStickerModal from './VehicleStickerModal'
import VehicleLogsModal from './VehicleLogsModal'

interface Vehicle {
  id: string
  plateNumber: string
  make: string | null
  model: string | null
  color: string | null
  scanToken: string
  isActive: boolean
  createdAt: string
  resident: {
    firstName: string
    lastName: string
    unit: { number: string; block: string | null } | null
  }
}

const COLOR_MAP: Record<string, string> = {
  black:  '#111827',
  white:  '#f9fafb',
  silver: '#9ca3af',
  red:    '#ef4444',
  blue:   '#3b82f6',
  green:  '#16a34a',
  grey:   '#6b7280',
  gray:   '#6b7280',
}

export default function VehiclesClient() {
  const { isAdmin }                         = useResident()
  const [vehicles, setVehicles]             = useState<Vehicle[]>([])
  const [filtered, setFiltered]             = useState<Vehicle[]>([])
  const [search, setSearch]                 = useState('')
  const [loading, setLoading]               = useState(true)
  const [showRegister, setShowRegister]     = useState(false)
  const [selectedSticker, setSelectedSticker] = useState<Vehicle | null>(null)
  const [selectedLogs, setSelectedLogs]     = useState<Vehicle | null>(null)
  const [deleting, setDeleting]             = useState<string | null>(null)
  const [rotating, setRotating]             = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await fetchJson<Vehicle[]>('/api/vehicles')
    setVehicles(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      vehicles.filter(v => {
        const base = `${v.plateNumber} ${v.make ?? ''} ${v.model ?? ''}`
        const withOwner = isAdmin
          ? `${base} ${v.resident.firstName} ${v.resident.lastName}`
          : base
        return withOwner.toLowerCase().includes(q)
      })
    )
  }, [vehicles, search, isAdmin])

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this vehicle? Its sticker will stop working immediately.')) return
    setDeleting(id)
    await fetchJson(`/api/vehicles/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  async function handleRotateToken(id: string) {
    if (!confirm('Rotate the QR token? The current sticker will be invalidated and a new one must be printed.')) return
    setRotating(id)
    await fetchJson(`/api/vehicles/${id}`, { method: 'PATCH' })
    setRotating(null)
    load()
  }

  const active   = vehicles.filter(v =>  v.isActive).length
  const inactive = vehicles.filter(v => !v.isActive).length

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Registered vehicles', value: vehicles.length, color: 'text-gray-900' },
          { label: 'Active stickers',     value: active,           color: 'text-green-600' },
          { label: 'Deactivated',         value: inactive,         color: 'text-red-500'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className={cn('text-2xl font-semibold', color)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded px-3 py-2">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder={isAdmin ? 'Search by plate, resident or make…' : 'Search by plate or make…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm focus:outline-none bg-transparent"
          />
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Plus size={15} /> Register vehicle
          </button>
        )}
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-16 text-center">
          <Car size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No vehicles registered</p>
          <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
            {isAdmin
              ? 'Register a vehicle to generate a QR sticker.'
              : 'You have no vehicles registered yet. Ask your estate admin to register your vehicle and issue a gate sticker.'
            }
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

      {/* Vehicle cards */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map(v => {
            const colorDot = COLOR_MAP[v.color?.toLowerCase() ?? ''] ?? '#9ca3af'
            return (
              <div
                key={v.id}
                className={cn(
                  'bg-white border rounded-xl p-5 transition-colors',
                  v.isActive ? 'border-gray-100 hover:border-gray-200' : 'border-gray-100 opacity-60'
                )}
              >
                <div className="flex items-start gap-4">

                  {/* Car icon with color dot */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <Car size={22} className="text-gray-500" />
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                      style={{ backgroundColor: colorDot }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base tracking-wide font-mono">
                        {v.plateNumber}
                      </h3>
                      {!v.isActive && (
                        <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {[v.color, v.make, v.model].filter(Boolean).join(' · ') || 'No details'}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-gray-400 mt-1">
                        Owner: {v.resident.firstName} {v.resident.lastName}
                        {v.resident.unit && (
                          ` — ${v.resident.unit.block ? v.resident.unit.block + ', ' : ''}${v.resident.unit.number}`
                        )}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* View QR sticker */}
                    {v.isActive && (
                      <button
                        onClick={() => setSelectedSticker(v)}
                        className="p-2 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="View QR sticker"
                      >
                        <QrCode size={15} />
                      </button>
                    )}

                    {/* View scan logs */}
                    <button
                      onClick={() => setSelectedLogs(v)}
                      className="p-2 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="View scan history"
                    >
                      <Eye size={15} />
                    </button>

                    {isAdmin && v.isActive && (
                      <>
                        {/* Rotate token */}
                        <button
                          onClick={() => handleRotateToken(v.id)}
                          disabled={rotating === v.id}
                          className="p-2 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                          title="Rotate QR token (invalidates current sticker)"
                        >
                          <RotateCcw size={15} />
                        </button>

                        {/* Deactivate */}
                        <button
                          onClick={() => handleDeactivate(v.id)}
                          disabled={deleting === v.id}
                          className="p-2 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Deactivate vehicle"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showRegister && (
        <RegisterVehicleModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => { setShowRegister(false); load() }}
        />
      )}

      {selectedSticker && (
        <VehicleStickerModal
          vehicle={selectedSticker}
          onClose={() => setSelectedSticker(null)}
        />
      )}

      {selectedLogs && (
        <VehicleLogsModal
          vehicle={selectedLogs}
          onClose={() => setSelectedLogs(null)}
        />
      )}
    </div>
  )
}