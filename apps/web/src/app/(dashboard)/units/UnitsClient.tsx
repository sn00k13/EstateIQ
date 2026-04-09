'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2, Boxes, X } from 'lucide-react'
import { fetchJson } from '@/lib/fetchJson'
import { useResident } from '@/context/ResidentContext'
import { useSubscription } from '@/context/SubscriptionContext'
import { cn } from '@/lib/utils'
import { resolveUnitTypeForSubmit } from '@/lib/unitTypes'
import UnitTypeFields from '@/components/units/UnitTypeFields'

interface Unit {
  id: string
  number: string
  block: string | null
  type: string | null
}

export default function UnitsClient() {
  const { isAdmin } = useResident()
  const { limits } = useSubscription()
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [form, setForm] = useState({
    number: '',
    block: '',
    typeSelect: '',
    typeOther: '',
  })

  const atUnitCap =
    limits.maxUnits !== -1 && units.length >= limits.maxUnits

  async function load() {
    setLoading(true)
    const { data, error } = await fetchJson<Unit[]>('/api/units')
    if (!error) setUnits(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleAddUnit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.number.trim()) return
    setAdding(true)
    setAddError('')
    const { data, error } = await fetchJson<Unit>('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: form.number.trim(),
        block: form.block.trim() || null,
        type: resolveUnitTypeForSubmit(form.typeSelect, form.typeOther),
      }),
    })
    if (error) {
      setAddError(error)
    } else if (data) {
      setUnits(prev => [...prev, data].sort((a, b) => {
        const ba = (a.block ?? '').localeCompare(b.block ?? '')
        if (ba !== 0) return ba
        return a.number.localeCompare(b.number, undefined, { numeric: true })
      }))
      setForm({ number: '', block: '', typeSelect: '', typeOther: '' })
      setShowAdd(false)
    }
    setAdding(false)
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {loading ? '—' : `${units.length} ${units.length === 1 ? 'unit' : 'units'} in this estate`}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setShowAdd(true)
                setAddError('')
              }}
              disabled={atUnitCap}
              title={atUnitCap ? `Plan limit: ${limits.maxUnits} units` : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white',
                atUnitCap
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-brand-600 hover:bg-brand-700'
              )}
            >
              <Plus size={18} />
              Add unit
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : units.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
            <Boxes className="h-12 w-12 text-gray-300" />
            <p className="mt-4 font-medium text-gray-900">No units yet</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {isAdmin
                ? 'Add units so you can assign members and track the estate inventory.'
                : 'Your estate admin can add units from this page.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Unit</th>
                  <th className="hidden px-4 py-3 font-semibold text-gray-700 sm:table-cell">
                    Street
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {units.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.number}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                      {u.block ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.type ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Add unit</h2>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddUnit} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Number <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  value={form.number}
                  onChange={e => setForm(p => ({ ...p, number: e.target.value }))}
                  placeholder="e.g. 12A"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Street
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  value={form.block}
                  onChange={e => setForm(p => ({ ...p, block: e.target.value }))}
                  placeholder="Optional, e.g. Oak Avenue"
                />
              </div>
              <UnitTypeFields
                typeSelect={form.typeSelect}
                typeOther={form.typeOther}
                onTypeSelectChange={v => setForm(p => ({ ...p, typeSelect: v }))}
                onTypeOtherChange={v => setForm(p => ({ ...p, typeOther: v }))}
                idPrefix="units-modal"
              />
              {addError && (
                <p className="text-sm text-red-600">{addError}</p>
              )}
              <button
                type="submit"
                disabled={adding}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-70"
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save unit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
