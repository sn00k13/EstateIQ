'use client'
import { useState } from 'react'
import { X, Copy, Check, Loader2 } from 'lucide-react'
import { fetchJson } from '@/lib/fetchJson'
import { uploadImageFile } from '@/lib/uploadImage'
import DashboardToast, { type DashboardToastPayload } from '@/components/dashboard/DashboardToast'

interface Props {
  paymentId: string
  amount: number
  levyTitle: string
  estateName: string
  duesBankName: string | null
  duesAccountNumber: string | null
  onClose: () => void
  onSuccess: () => void
  /** Reserved for custom Paystack integration per estate. */
  onPaystack?: () => void
}

function fmt(n: number) {
  return '₦' + n.toLocaleString('en-NG')
}

export default function LevyPayModal({
  paymentId,
  amount,
  levyTitle,
  estateName,
  duesBankName,
  duesAccountNumber,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<DashboardToastPayload | null>(null)

  const hasBank = Boolean(duesBankName?.trim() && duesAccountNumber?.trim())

  async function copyAccount() {
    if (!duesAccountNumber) return
    try {
      await navigator.clipboard.writeText(duesAccountNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await uploadImageFile(file, { folder: 'levies', onlyImages: false })
    setUploading(false)
    if ('error' in result) {
      setToast({ message: result.error, variant: 'error' })
      return
    }
    setSubmitting(true)
    const { error } = await fetchJson('/api/payments/' + paymentId + '/receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptUrl: result.url }),
    })
    setSubmitting(false)
    if (error) {
      setToast({ message: error, variant: 'error' })
      return
    }
    onSuccess()
    onClose()
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Pay levy</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{levyTitle}</span>
            <span className="text-gray-400"> · </span>
            {fmt(amount)}
          </p>

          {step === 1 && (
            <>
              {!hasBank ? (
                <div className="rounded-lg bg-amber-50 text-amber-900 text-sm px-3 py-2.5">
                  Your estate admin has not set a dues bank account yet. Ask an admin to add bank details
                  under Levies &amp; Dues so you can pay by transfer.
                  {/* Online card payment (Paystack) available as custom integration for selected estates. */}
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Transfer <strong>{fmt(amount)}</strong> to the {estateName} account below. Use your
                    name or unit as the transfer narration so we can match your payment.
                  </p>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                    {duesBankName && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Bank</p>
                        <p className="text-sm font-medium text-gray-900">{duesBankName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Account number</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-lg font-mono font-semibold text-gray-900 tracking-wide">
                          {duesAccountNumber}
                        </p>
                        <button
                          type="button"
                          onClick={copyAccount}
                          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"
                          title="Copy account number"
                        >
                          {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Payee name should appear as the estate or account name shown by your bank.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                  >
                    I&apos;ve made the transfer
                  </button>
                </>
              )}

              {/*
              Custom client integration — card payments via Paystack (re-enable when wired per estate).
              <button
                type="button"
                onClick={onPaystack}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={14} />
                Pay online with Paystack
              </button>
              */}
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-gray-600">
                Upload a screenshot or PDF of your transfer receipt. Your payment will stay{' '}
                <strong>pending</strong> until an estate admin confirms it.
              </p>
              <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  className="hidden"
                  disabled={uploading || submitting}
                  onChange={handleFileChange}
                />
                {uploading || submitting ? (
                  <Loader2 className="animate-spin text-brand-600" size={28} />
                ) : (
                  <span className="text-sm text-brand-600 font-medium">Choose receipt file</span>
                )}
                <span className="text-xs text-gray-400 mt-1">Images or PDF, max 5MB</span>
              </label>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to account details
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    <DashboardToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
