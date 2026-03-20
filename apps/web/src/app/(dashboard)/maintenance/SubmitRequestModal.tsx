'use client'
import { useState } from 'react'
import { X, Loader2, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'

interface Props { onClose: () => void; onSuccess: () => void }

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'

const CATEGORIES = [
  'Plumbing', 'Electrical', 'Generator', 'Security / Gate',
  'Roads & Drainage', 'Landscaping', 'Cleaning', 'Structural', 'Other',
]

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'LOW',       label: 'Low',       color: 'border-gray-200  text-gray-600  bg-gray-50'   },
  { value: 'MEDIUM',    label: 'Medium',    color: 'border-brand-200  text-brand-700  bg-brand-50'   },
  { value: 'HIGH',      label: 'High',      color: 'border-amber-200 text-amber-700 bg-amber-50'  },
  { value: 'EMERGENCY', label: 'Emergency', color: 'border-red-200   text-red-700   bg-red-50'    },
]

export default function SubmitRequestModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'MEDIUM' as Priority,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await fetchJson('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (error) { setError(error); setLoading(false); return }
    onSuccess()
  }

  const canSubmit = form.title.trim() && form.description.trim() && form.category

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Submit maintenance request</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.title} onChange={set('title')} required
              placeholder="e.g. Burst pipe at Block A entrance"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category} onChange={set('category')} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITIES.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, priority: value }))}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-sm font-medium text-left transition-all',
                    form.priority === value
                      ? `${color} ring-1 ring-current ring-offset-1`
                      : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description} onChange={set('description')} required rows={4}
              placeholder="Describe the issue in detail — location, when it started, how severe it is..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
            />
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500">
            Photo attachments can be added after submission. The estate admin will be notified and assign a technician.
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading || !canSubmit}
              className="flex-1 bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Submitting...</>
                : 'Submit request'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}