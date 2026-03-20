'use client'
import { useState } from 'react'
import { X, Loader2, ShieldCheck } from 'lucide-react'
import { fetchJson } from '@/lib/fetchJson'

interface Props { onClose: () => void; onSuccess: () => void }

export default function RegisterVisitorModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: '', phone: '', purpose: '', expectedAt: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }))
  }

  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await fetchJson('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (error) { setError(error); setLoading(false); return }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Register visitor</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visitor name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.name} onChange={set('name')} required
              placeholder="e.g. John Okafor"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel" value={form.phone} onChange={set('phone')}
                placeholder="e.g. 08012345678"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected at <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local" value={form.expectedAt} onChange={set('expectedAt')}
                min={nowLocal} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of visit</label>
            <input
              type="text" value={form.purpose} onChange={set('purpose')}
              placeholder="e.g. Family visit, Delivery, Contractor"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div className="bg-brand-50 rounded-lg px-4 py-3 text-xs text-brand-700">
            A 6-digit access code will be generated. Share it with your visitor — security will use it at the gate.
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading || !form.name.trim() || !form.expectedAt}
              className="flex-1 bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Registering...</>
                : 'Register & get code'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}