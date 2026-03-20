'use client'
import { useEffect, useState } from 'react'
import { X, Loader2, Plus } from 'lucide-react'
import { fetchJson } from '@/lib/fetchJson'

interface Unit { id: string; number: string; block: string | null }
interface Props { onClose: () => void; onSuccess: () => void }

export default function AddResidentModal({ onClose, onSuccess }: Props) {
  const [units, setUnits]             = useState<Unit[]>([])
  const [unitsLoading, setUnitsLoading] = useState(true)
  const [unitsError, setUnitsError]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [newUnit, setNewUnit]         = useState({ number: '', block: '' })
  const [addingUnit, setAddingUnit]   = useState(false)
  const [addUnitError, setAddUnitError] = useState('')

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', unitId: '', role: 'RESIDENT',
  })

  async function loadUnits() {
    setUnitsLoading(true)
    setUnitsError('')
    const { data, error } = await fetchJson<Unit[]>('/api/units')
    if (error) {
      setUnitsError(error)
      setUnits([])
    } else {
      setUnits(data ?? [])
    }
    setUnitsLoading(false)
  }

  useEffect(() => { loadUnits() }, [])

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }))
  }

  async function handleAddUnit() {
    if (!newUnit.number.trim()) return
    setAddingUnit(true)
    setAddUnitError('')

    const { data, error } = await fetchJson<Unit>('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUnit),
    })

    if (error) {
      setAddUnitError(error)
    } else if (data) {
      await loadUnits()
      setForm(p => ({ ...p, unitId: data.id }))
      setNewUnit({ number: '', block: '' })
      setShowAddUnit(false)
    }
    setAddingUnit(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await fetchJson('/api/residents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (error) { setError(error); setLoading(false); return }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-900">Add resident</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {(['firstName', 'lastName'] as const).map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field === 'firstName' ? 'First name' : 'Last name'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={form[field]} onChange={set(field)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email" value={form.email} onChange={set('email')} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel" value={form.phone} onChange={set('phone')}
              placeholder="e.g. 08012345678"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          {/* Unit assignment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Assign unit</label>
              <button
                type="button"
                onClick={() => { setShowAddUnit(v => !v); setAddUnitError('') }}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                <Plus size={12} /> New unit
              </button>
            </div>

            {showAddUnit && (
              <div className="mb-2 p-3 bg-brand-50 rounded-lg space-y-2">
                <p className="text-xs font-medium text-brand-700">Create a new unit</p>
                {addUnitError && (
                  <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{addUnitError}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Block (e.g. Block A)"
                    value={newUnit.block}
                    onChange={e => setNewUnit(p => ({ ...p, block: e.target.value }))}
                    className="w-full border border-brand-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="text"
                    placeholder="Number (e.g. House 3) *"
                    value={newUnit.number}
                    onChange={e => setNewUnit(p => ({ ...p, number: e.target.value }))}
                    className="w-full border border-brand-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddUnit(false); setAddUnitError('') }}
                    className="flex-1 text-sm text-gray-500 border border-gray-200 bg-white rounded-lg py-1.5 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddUnit}
                    disabled={!newUnit.number.trim() || addingUnit}
                    className="flex-1 text-sm text-white bg-brand-600 rounded-lg py-1.5 hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {addingUnit ? <Loader2 size={12} className="animate-spin" /> : null}
                    {addingUnit ? 'Adding...' : 'Add unit'}
                  </button>
                </div>
              </div>
            )}

            {unitsLoading ? (
              <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" /> Loading units...
              </div>
            ) : unitsError ? (
              <div className="w-full border border-red-200 bg-red-50 rounded-lg px-3 py-2 text-sm text-red-600 flex items-center justify-between">
                <span>Failed to load units</span>
                <button type="button" onClick={loadUnits} className="text-xs underline">Retry</button>
              </div>
            ) : (
              <select
                value={form.unitId}
                onChange={set('unitId')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
              >
                <option value="">No unit assigned</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.block ? `${u.block}, ` : ''}{u.number}
                  </option>
                ))}
              </select>
            )}

            {!unitsLoading && !unitsError && units.length === 0 && !showAddUnit && (
              <p className="text-xs text-amber-600 mt-1">
                No units yet — click "New unit" above to create one first.
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role} onChange={set('role')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
            >
              <option value="RESIDENT">Resident</option>
              <option value="ADMIN">Admin</option>
              <option value="SECURITY">Security</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : 'Add resident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}