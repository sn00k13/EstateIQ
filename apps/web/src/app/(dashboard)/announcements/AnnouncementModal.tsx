'use client'
import { useState } from 'react'
import { X, Loader2, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'

type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

interface Announcement {
  id: string; title: string; body: string; priority: Priority
}

interface Props {
  existing: Announcement | null
  onClose: () => void
  onSuccess: () => void
}

const PRIORITIES: { value: Priority; label: string; description: string; color: string }[] = [
  { value: 'LOW',    label: 'Low',    description: 'General info',       color: 'border-gray-200  bg-gray-50   text-gray-600' },
  { value: 'NORMAL', label: 'Normal', description: 'Standard notice',    color: 'border-brand-200  bg-brand-50   text-brand-700' },
  { value: 'HIGH',   label: 'High',   description: 'Important update',   color: 'border-amber-200 bg-amber-50  text-amber-700' },
  { value: 'URGENT', label: 'Urgent', description: 'Immediate attention', color: 'border-red-200   bg-red-50    text-red-700' },
]

export default function AnnouncementModal({ existing, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    title:    existing?.title    ?? '',
    body:     existing?.body     ?? '',
    priority: existing?.priority ?? 'NORMAL' as Priority,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const isEdit = !!existing

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url    = isEdit ? `/api/announcements/${existing.id}` : '/api/announcements'
    const method = isEdit ? 'PATCH' : 'POST'

    const { error } = await fetchJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (error) { setError(error); setLoading(false); return }
    onSuccess()
  }

  const charCount = form.body.length

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Megaphone size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">
              {isEdit ? 'Edit announcement' : 'New announcement'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Water supply suspension this Saturday"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          {/* Priority selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITIES.map(({ value, label, description, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, priority: value }))}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all',
                    form.priority === value
                      ? `${color} border-current ring-1 ring-current ring-offset-1`
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                  )}
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    value === 'URGENT' ? 'bg-red-500' :
                    value === 'HIGH'   ? 'bg-amber-400' :
                    value === 'NORMAL' ? 'bg-brand-500' : 'bg-gray-400'
                  )} />
                  <div>
                    <p className="text-xs font-semibold leading-none">{label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <span className={cn(
                'text-xs',
                charCount > 900 ? 'text-red-500' : 'text-gray-400'
              )}>
                {charCount} / 1000
              </span>
            </div>
            <textarea
              value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              placeholder="Write your announcement here..."
              required
              maxLength={1000}
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
            />
          </div>

          {/* Preview strip */}
          {form.title && (
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <div className={cn(
                'h-1',
                form.priority === 'URGENT' ? 'bg-red-500' :
                form.priority === 'HIGH'   ? 'bg-amber-400' :
                form.priority === 'NORMAL' ? 'bg-blue-400' : 'bg-gray-200'
              )} />
              <div className="px-4 py-3 bg-gray-50">
                <p className="text-xs text-gray-400 mb-0.5">Preview</p>
                <p className="text-sm font-semibold text-gray-900">{form.title}</p>
                {form.body && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{form.body}</p>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading || !form.title.trim() || !form.body.trim()}
              className="flex-1 bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> {isEdit ? 'Saving...' : 'Publishing...'}</>
                : isEdit ? 'Save changes' : 'Publish'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}