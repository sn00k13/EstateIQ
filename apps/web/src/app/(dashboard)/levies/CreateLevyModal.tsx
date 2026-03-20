'use client'
import { useState } from 'react'
import { X, Loader2, CreditCard } from 'lucide-react'
import { fetchJson } from '@/lib/fetchJson'

interface Props { onClose: () => void; onSuccess: () => void }

export default function CreateLevyModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    title: '', description: '', amount: '', dueDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }))
  }

  // Minimum due date is tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await fetchJson('/api/levies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (error) { setError(error); setLoading(false); return }
    onSuccess()
  }

  const amountNum = parseFloat(form.amount)
  const isValidAmount = !isNaN(amountNum) && amountNum > 0

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Create levy</h2>
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
              Levy title <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.title} onChange={set('title')} required
              placeholder="e.g. Q1 2025 Estate Dues"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description} onChange={set('description')} rows={2}
              placeholder="Optional details about what this levy covers..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₦) <span className="text-red-500">*</span>
              </label>
              <input
                type="number" value={form.amount} onChange={set('amount')}
                min="1" step="0.01" required
                placeholder="e.g. 25000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due date <span className="text-red-500">*</span>
              </label>
              <input
                type="date" value={form.dueDate} onChange={set('dueDate')}
                min={minDate} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
          </div>

          {/* Summary note */}
          {form.title && isValidAmount && (
            <div className="bg-brand-50 rounded-lg px-4 py-3 text-xs text-brand-700 space-y-1">
              <p className="font-medium">What happens when you create this levy:</p>
              <p>• A payment invoice of <strong>₦{amountNum.toLocaleString()}</strong> will be generated for every unit</p>
              <p>• Residents can pay online via Paystack</p>
              <p>• You can track who has paid from the levy detail view</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.title.trim() || !isValidAmount || !form.dueDate}
              className="flex-1 bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
                : 'Create levy'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}