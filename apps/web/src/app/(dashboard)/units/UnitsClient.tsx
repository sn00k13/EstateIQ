'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2, Boxes, X, Search } from 'lucide-react'
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
  const [filtered, setFiltered] = useState<Unit[]>([])
  const [search, setSearch] = useState('')
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

  useEffect(() => {
    const q = search.toLowerCase().trim()
    if (!q) {
      setFiltered(units)
      return
    }
    setFiltered(
      units.filter(u => {
        const hay = `${u.number} ${u.block ?? ''} ${u.type ?? ''}`.toLowerCase()
        return hay.includes(q)
      })
    )
  }, [search, units])

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
      setUnits(prev =>
        [...prev, data].sort((a, b) => {
          const ba = (a.block ?? '').localeCompare(b.block ?? '')
          if (ba !== 0) return ba
          return a.number.localeCompare(b.number, undefined, { numeric: true })
        })
      )
      setForm({ number: '', block: '', typeSelect: '', typeOther: '' })
      setShowAdd(false)
    }
    setAdding(false)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="max-w-sm">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '—' : units.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total units</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 text-gray-400">
              <Boxes size={18} strokeWidth={1.75} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded px-3 py-2">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by unit number, street, or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm focus:outline-none bg-transparent"
          />
        </div>
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
              'flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors',
              atUnitCap
                ? 'cursor-not-allowed bg-gray-300 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            )}
          >
            <Plus size={15} /> Add unit
          </button>
        )}
      </div>

      {/* Table — matches Members */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Unit', 'Street', 'Type'].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="text-center py-12 text-gray-400 text-sm">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-12 text-gray-400 text-sm">
                  {search.trim()
                    ? 'No units match your search.'
                    : isAdmin
                      ? 'No units yet. Add one to get started.'
                      : 'No units yet. Your estate admin can add units from this page.'}
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map(u => {
                const initials =
                  u.number.replace(/\s/g, '').slice(0, 2).toUpperCase() || '?'
                return (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.number}</p>
                          {u.block?.trim() && (
                            <p className="text-xs text-gray-400 md:hidden">{u.block}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {u.block?.trim() ? u.block : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.type?.trim() ? (
                        <span
                          className="inline-flex max-w-[220px] truncate rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800"
                          title={u.type}
                        >
                          {u.type}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
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
