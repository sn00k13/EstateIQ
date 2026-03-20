'use client'
import { useState } from 'react'
import { X, Loader2, Plus, Trash2, BarChart2 } from 'lucide-react'
import { fetchJson } from '@/lib/fetchJson'

interface Props { onClose: () => void; onSuccess: () => void }

export default function CreatePollModal({ onClose, onSuccess }: Props) {
  const [question, setQuestion]     = useState('')
  const [options, setOptions]       = useState(['', ''])
  const [endsAt, setEndsAt]         = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  // Minimum end date is 1 hour from now
  const minDate = new Date(Date.now() + 3600000 - new Date().getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16)

  function updateOption(i: number, value: string) {
    setOptions(prev => prev.map((o, idx) => idx === i ? value : o))
  }

  function addOption() {
    if (options.length < 8) setOptions(prev => [...prev, ''])
  }

  function removeOption(i: number) {
    if (options.length <= 2) return
    setOptions(prev => prev.filter((_, idx) => idx !== i))
  }

  const validOptions = options.filter(o => o.trim())
  const canSubmit    = question.trim() && validOptions.length >= 2 && endsAt

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await fetchJson('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options, endsAt, isAnonymous }),
    })

    if (error) { setError(error); setLoading(false); return }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Create poll</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Should we install CCTV cameras at the main gate?"
              required rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Options <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">{options.length}/8</span>
            </div>

            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-5 text-right shrink-0">{i + 1}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    disabled={options.length <= 2}
                    className="p-1.5 text-gray-300 hover:text-red-500 disabled:opacity-20 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {options.length < 8 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                <Plus size={13} /> Add option
              </button>
            )}
          </div>

          {/* End date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voting closes at <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={e => setEndsAt(e.target.value)}
              min={minDate} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setIsAnonymous(p => !p)}
              className={`relative w-9 h-5 rounded-full transition-colors ${isAnonymous ? 'bg-brand-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-4' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Anonymous voting</p>
              <p className="text-xs text-gray-400">Residents won't see who voted for what</p>
            </div>
          </label>

          {/* Preview */}
          {question.trim() && validOptions.length >= 2 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Preview</p>
              <p className="text-sm font-semibold text-gray-900">{question}</p>
              {validOptions.map((o, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
                  {o}
                </div>
              ))}
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
              type="submit" disabled={loading || !canSubmit}
              className="flex-1 bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
                : 'Launch poll'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}