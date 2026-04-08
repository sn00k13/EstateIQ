'use client'
import { useEffect, useState } from 'react'
import { X, Loader2, Car } from 'lucide-react'
import { fetchJson } from '@/lib/fetchJson'

interface Resident { id: string; firstName: string; lastName: string; unit: { number: string; block: string | null } | null }
interface Props { onClose: () => void; onSuccess: () => void }

const COLORS = ['Black', 'White', 'Silver', 'Grey', 'Red', 'Blue', 'Green', 'Brown', 'Gold', 'Other']

export default function RegisterVehicleModal({ onClose, onSuccess }: Props) {
  const [residents, setResidents]   = useState<Resident[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm] = useState({
    residentId: '', plateNumber: '', make: '', model: '', color: '',
  })

  useEffect(() => {
    fetchJson<Resident[] | { data: Resident[] }>('/api/residents?limit=100').then(({ data }) => {
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      setResidents(list)
    })
  }, [])

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await fetchJson('/api/vehicles', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })

    if (error) { setError(error); setLoading(false); return }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Car size={16} className="text-green-600" />
            <h2 className="font-semibold text-gray-900">Register vehicle</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded">{error}</div>
          )}

          {/* Resident */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resident <span className="text-red-500">*</span>
            </label>
            <select
              value={form.residentId} onChange={set('residentId')} required
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Select a resident</option>
              {residents.filter(r => r.id).map(r => (
                <option key={r.id} value={r.id}>
                  {r.firstName} {r.lastName}
                  {r.unit ? ` — ${r.unit.block ? r.unit.block + ', ' : ''}${r.unit.number}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Plate number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plate number <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.plateNumber} onChange={set('plateNumber')} required
              placeholder="e.g. ABC-123-XY"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
            />
          </div>

          {/* Make + Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input
                type="text" value={form.make} onChange={set('make')}
                placeholder="e.g. Toyota"
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text" value={form.model} onChange={set('model')}
                placeholder="e.g. Camry"
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <select
              value={form.color} onChange={set('color')}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Select color</option>
              {COLORS.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
            </select>
          </div>

          <div className="bg-green-50 rounded px-4 py-3 text-xs text-green-700">
            A unique QR code will be generated. Print the sticker from the vehicle card after registration.
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded py-2.5 text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading || !form.residentId || !form.plateNumber}
              className="flex-1 bg-green-600 text-white rounded py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Registering...</> : 'Register vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}