'use client'
import { useRef, useState } from 'react'
import { X, Loader2, Wrench, ImagePlus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import { uploadImageFile, deleteUploadedUrls } from '@/lib/uploadImage'

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

const MAX_ATTACHMENTS = 6

export default function SubmitRequestModal({ onClose, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'MEDIUM' as Priority,
  })
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [dismissing, setDismissing] = useState(false)
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
      body: JSON.stringify({ ...form, mediaUrls }),
    })

    if (error) { setError(error); setLoading(false); return }
    onSuccess()
  }

  const canSubmit = form.title.trim() && form.description.trim() && form.category

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return
    const remaining = MAX_ATTACHMENTS - mediaUrls.length
    if (remaining <= 0) return
    const list = Array.from(files).slice(0, remaining)
    setError('')
    setUploading(true)
    for (const file of list) {
      const result = await uploadImageFile(file, { folder: 'maintenance' })
      if ('error' in result) {
        setError(result.error)
        setUploading(false)
        return
      }
      setMediaUrls(prev => [...prev, result.url])
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function removeAttachment(index: number) {
    const url = mediaUrls[index]
    setError('')
    setUploading(true)
    const { ok, error: delErr } = await deleteUploadedUrls([url])
    setUploading(false)
    if (!ok) {
      setError(delErr ?? 'Could not remove photo')
      return
    }
    setMediaUrls(prev => prev.filter((_, i) => i !== index))
  }

  async function handleDismiss() {
    if (dismissing) return
    setError('')
    if (mediaUrls.length > 0) {
      setDismissing(true)
      const { ok, error: delErr } = await deleteUploadedUrls(mediaUrls)
      setDismissing(false)
      if (!ok) {
        setError(delErr ?? 'Could not remove photos')
        return
      }
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Submit maintenance request</h2>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={dismissing}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-50"
          >
            {dismissing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.title} onChange={set('title')} required
              placeholder="e.g. Burst pipe at main street entrance"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category} onChange={set('category')} required
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
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
                    'px-3 py-2 rounded border text-sm font-medium text-left transition-all',
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
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Add up to {MAX_ATTACHMENTS} images (max 5MB each). Stored securely on Cloudinary.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading || mediaUrls.length >= MAX_ATTACHMENTS}
              onChange={e => onPickFiles(e.target.files)}
            />
            <div className="flex flex-wrap gap-2">
              {mediaUrls.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    disabled={uploading}
                    className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    aria-label="Remove photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {mediaUrls.length < MAX_ATTACHMENTS && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-xs text-gray-400 transition-colors',
                    uploading
                      ? 'border-gray-100 cursor-wait'
                      : 'border-gray-200 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50'
                  )}
                >
                  {uploading ? (
                    <Loader2 size={18} className="animate-spin text-brand-600" />
                  ) : (
                    <>
                      <ImagePlus size={18} />
                      <span>Add</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded px-4 py-3 text-xs text-gray-500">
            The estate admin will be notified and can assign a technician.
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={dismissing}
              className="flex-1 border border-gray-200 text-gray-700 rounded py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {dismissing ? 'Removing…' : 'Cancel'}
            </button>
            <button
              type="submit" disabled={loading || uploading || dismissing || !canSubmit}
              className="flex-1 bg-brand-600 text-white rounded py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
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