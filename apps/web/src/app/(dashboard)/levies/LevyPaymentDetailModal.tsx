'use client'
import { X, CheckCircle2, Clock, ExternalLink, ShieldCheck, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PaymentRowDetail {
  id: string
  status: string
  amount: number
  paidAt: string | null
  reference: string | null
  receiptUrl: string | null
  unit: { id: string; number: string; block: string | null }
  resident: { id: string; firstName: string; lastName: string; email: string }
}

interface Props {
  payment: PaymentRowDetail
  levyTitle: string
  levyAmount: number
  levyDueDate: string
  estateName: string
  isAdmin: boolean
  isMine: boolean
  approving: boolean
  onClose: () => void
  onPayNow: () => void
  /** Reserved for custom Paystack integration per estate. */
  onPaystack?: () => void
  onApprove: () => void
}

function fmt(n: number) {
  return '₦' + n.toLocaleString('en-NG')
}

export default function LevyPaymentDetailModal({
  payment: p,
  levyTitle,
  levyAmount,
  levyDueDate,
  estateName,
  isAdmin,
  isMine,
  approving,
  onClose,
  onPayNow,
  onApprove,
}: Props) {
  const pendingApproval = p.status === 'PENDING' && p.receiptUrl

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-100"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="rounded-lg p-2 bg-brand-50 text-brand-600 shrink-0">
              <User size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {p.resident.firstName} {p.resident.lastName}
              </h3>
              <p className="text-xs text-gray-500 truncate">{p.resident.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Levy</p>
            <p className="font-medium text-gray-900">{levyTitle}</p>
            <p className="text-xs text-gray-500 mt-1">{estateName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Unit</p>
              <p className="font-medium text-gray-900">
                {p.unit.block ? `${p.unit.block}, ` : ''}{p.unit.number}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Levy due</p>
              <p className="font-medium text-gray-900">
                {new Date(levyDueDate).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Invoice amount</span>
              <span className="font-semibold text-gray-900">{fmt(levyAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Payment status</span>
              <span>
                {p.status === 'PAID' ? (
                  <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                    <CheckCircle2 size={12} /> Paid
                  </span>
                ) : pendingApproval ? (
                  <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                    <Clock size={12} /> Pending approval
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                    <Clock size={12} /> Pending
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-600 shrink-0">Paid on</span>
              <span className="text-right text-gray-900 text-xs">
                {p.paidAt
                  ? new Date(p.paidAt).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </span>
            </div>
            {p.reference && (
              <div className="flex justify-between items-start gap-2 pt-1 border-t border-gray-200">
                <span className="text-gray-600 shrink-0">Reference</span>
                <span className="text-right text-xs font-mono text-gray-800 break-all">{p.reference}</span>
              </div>
            )}
            {p.receiptUrl && (
              <div className="pt-1 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Transfer receipt</p>
                <a
                  href={p.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                >
                  <ExternalLink size={12} /> View receipt
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {p.status === 'PENDING' && isMine && !p.receiptUrl && (
              <button
                type="button"
                onClick={onPayNow}
                className="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
              >
                Pay now
              </button>
            )}
            {p.status === 'PENDING' && isMine && p.receiptUrl && (
              <p className="text-xs text-center text-gray-500">Awaiting estate admin approval</p>
            )}
            {p.status === 'PENDING' && isAdmin && p.receiptUrl && (
              <button
                type="button"
                onClick={onApprove}
                disabled={approving}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700',
                  approving && 'opacity-60'
                )}
              >
                {approving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Approve payment
              </button>
            )}
            {/*
            Custom client integration — card payments via Paystack.
            {p.status === 'PENDING' && isMine && (
              <button
                type="button"
                onClick={onPaystack}
                className="w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Pay online with Paystack
              </button>
            )}
            */}
          </div>
        </div>
      </div>
    </div>
  )
}
