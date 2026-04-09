'use client'
import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'

interface Props { onClose: () => void; onSuccess: () => void }

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

const SEVERITIES: { value: Severity; label: string; description: string; color: string }[] = [
  { value: 'LOW',      label: 'Low',      description: 'Minor, no immediate risk',  color: 'border-gray-200   bg-gray-50   text-gray-700'   },
  { value: 'MEDIUM',   label: 'Medium',   description: 'Moderate, needs attention', color: 'border-amber-200  bg-amber-50  text-amber-700'  },
  { value: 'HIGH',     label: 'High',     description: 'Serious, act soon',         color: 'border-orange-200 bg-orange-50 text-orange-700' },
  { value: 'CRITICAL', label: 'Critical', description: 'Emergency, act now',        color: 'border-red-200    bg-red-50    text-red-700'    },
]

export default function ReportIncidentModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    title: '', description: '', severity: 'MEDIUM' as Severity, location: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await fetchJson('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (error) { setError(error); setLoading(false); return }
    onSuccess()
  }

  const canSubmit = form.title.trim() && form.description.trim()

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <h2 className="font-semibold text-gray-900">Report security incident</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Incident title <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.title} onChange={set('title')} required
              placeholder="e.g. Suspicious person at main street gate"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITIES.map(({ value, label, description, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, severity: value }))}
                  className={cn(
                    'flex items-start gap-2.5 px-3 py-2.5 rounded border text-left transition-all',
                    form.severity === value
                      ? `${color} ring-1 ring-current ring-offset-1`
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  )}
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full shrink-0 mt-1',
                    value === 'CRITICAL' ? 'bg-red-500' :
                    value === 'HIGH'     ? 'bg-orange-500' :
                    value === 'MEDIUM'   ? 'bg-amber-500' : 'bg-gray-400'
                  )} />
                  <div>
                    <p className="text-xs font-semibold leading-none">{label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text" value={form.location} onChange={set('location')}
              placeholder="e.g. Main gate, Oak Avenue entrance, Car park"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description} onChange={set('description')} required rows={4}
              placeholder="Describe what happened in detail — time, people involved, what was observed, any action taken..."
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>

          {form.severity === 'CRITICAL' && (
            <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-xs text-red-700">
              <p className="font-semibold mb-0.5">Critical incident</p>
              <p>This will be flagged immediately to estate administrators. If lives are at risk, contact emergency services first.</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading || !canSubmit}
              className="flex-1 bg-red-600 text-white rounded py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Submitting...</>
                : 'Submit report'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}