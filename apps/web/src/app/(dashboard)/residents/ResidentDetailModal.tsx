'use client'
import { useEffect, useState } from 'react'
import {
  X, Mail, Phone, Home, Shield, Calendar, User, HardHat,
  CreditCard, Wrench, AlertTriangle, Car, Printer, RefreshCw,
} from 'lucide-react'
import QRCodeReact from 'react-qr-code'
import QRCodeLib from 'qrcode'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import { useResident } from '@/context/ResidentContext'

interface Unit { id: string; number: string; block: string | null }
interface Resident {
  id: string; firstName: string; lastName: string
  email: string; phone: string | null; role: string
  isActive: boolean; joinedAt: string; unit: Unit | null
  /** Gate scan token (ID card QR). */
  residentScanToken: string
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN:       'bg-purple-50 text-purple-700',
  SECURITY:    'bg-amber-50  text-amber-700',
  RESIDENT:    'bg-brand-50   text-brand-700',
  SUPER_ADMIN: 'bg-red-50    text-red-700',
}

const ROLE_ICONS: Record<string, any> = {
  ADMIN: Shield, SECURITY: HardHat, RESIDENT: User, SUPER_ADMIN: Shield,
}

type TabId = 'profile' | 'payments' | 'maintenance' | 'incidents' | 'vehicles'

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'payments', label: 'Payment history' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'vehicles', label: 'Vehicles' },
]

interface PaymentRow {
  id: string
  amount: number
  currency: string
  status: string
  paidAt: string | null
  createdAt: string
  levy: { title: string }
}

type MaintenanceStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'

interface MaintenanceRow {
  id: string
  title: string
  description: string
  category: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  createdAt: string
}

type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface IncidentRow {
  id: string
  title: string
  description: string
  severity: IncidentSeverity
  location: string | null
  resolvedAt: string | null
  createdAt: string
}

interface VehicleRow {
  id: string
  plateNumber: string
  make: string | null
  model: string | null
  color: string | null
  isActive: boolean
  createdAt: string
}

interface ResidentHistory {
  payments: PaymentRow[]
  maintenanceRequests: MaintenanceRow[]
  incidents: IncidentRow[]
  vehicles: VehicleRow[]
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID:    'bg-green-50 text-green-700',
  PENDING: 'bg-amber-50 text-amber-700',
}

const MAINT_STATUS_STYLES: Record<MaintenanceStatus, string> = {
  OPEN:        'bg-brand-50 text-brand-700',
  ASSIGNED:    'bg-purple-50 text-purple-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  RESOLVED:    'bg-green-50 text-green-700',
  CLOSED:      'bg-gray-100 text-gray-600',
}

const INCIDENT_SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  LOW:      'bg-gray-100 text-gray-600',
  MEDIUM:   'bg-amber-50 text-amber-700',
  HIGH:     'bg-orange-50 text-orange-700',
  CRITICAL: 'bg-red-50 text-red-700',
}

interface Props {
  resident: Resident
  onClose: () => void
  onToggleActive: (id: string, current: boolean) => void
  onResidentPatch?: (resident: Resident) => void
}

function escHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

export default function ResidentDetailModal({
  resident,
  onClose,
  onToggleActive,
  onResidentPatch,
}: Props) {
  const { profile, isAdmin } = useResident()
  const RoleIcon = ROLE_ICONS[resident.role] ?? User
  const initials = `${resident.firstName[0]}${resident.lastName[0]}`.toUpperCase()
  const [tab, setTab] = useState<TabId>('profile')
  const [historyLoading, setHistoryLoading] = useState(true)
  const [history, setHistory] = useState<ResidentHistory | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [qrOrigin, setQrOrigin] = useState('')
  const [rotatingQr, setRotatingQr] = useState(false)

  useEffect(() => {
    setQrOrigin(typeof window !== 'undefined' ? window.location.origin : '')
  }, [])

  const primaryDetails = [
    {
      icon: Mail,
      label: 'Email address',
      value: resident.email,
    },
    {
      icon: Phone,
      label: 'Phone number',
      value: resident.phone ?? 'Not provided',
      muted: !resident.phone,
    },
    {
      icon: Home,
      label: 'Unit',
      value: resident.unit
        ? `${resident.unit.block ? resident.unit.block + ', ' : ''}${resident.unit.number}`
        : 'No unit assigned',
      muted: !resident.unit,
    },
  ]

  const memberSinceFormatted = new Date(resident.joinedAt).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const unitLine = resident.unit
    ? `${resident.unit.block ? resident.unit.block + ', ' : ''}${resident.unit.number}`
    : 'No unit assigned'

  const estateName = profile?.estate?.name
  const roleLabel =
    resident.role.charAt(0) + resident.role.slice(1).toLowerCase().replace(/_/g, ' ')

  const qrValue =
    qrOrigin && resident.residentScanToken
      ? `${qrOrigin}/api/scan/resident?token=${encodeURIComponent(resident.residentScanToken)}`
      : ''

  async function handleRotateResidentQr() {
    if (!isAdmin || !onResidentPatch) return
    setRotatingQr(true)
    const { data, error } = await fetchJson<Resident>(
      `/api/residents/${resident.id}/rotate-qr`,
      { method: 'POST' }
    )
    setRotatingQr(false)
    if (error) {
      alert(error)
      return
    }
    if (data) onResidentPatch(data)
  }

  async function openPrintIdCard() {
    const fullName = `${resident.firstName} ${resident.lastName}`
    let qrDataUrl = ''
    if (qrValue) {
      try {
        qrDataUrl = await QRCodeLib.toDataURL(qrValue, { margin: 1, width: 120 })
      } catch {
        qrDataUrl = ''
      }
    }
    const headerRight = escHtml(estateName ?? 'Estate member')
    const qrBlock = qrDataUrl
      ? `<div class="qr-wrap"><img src="${qrDataUrl}" alt="" width="120" height="120" class="qr-img"/></div>`
      : ''
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Resident ID — ${escHtml(fullName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; font-family: ui-sans-serif, system-ui, sans-serif; background: #fff; color: #111827; }
    .card { max-width: 520px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 2px solid #e5e7eb; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
    .head { background: linear-gradient(90deg, #059669, #047857); color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
    .head span:last-child { text-align: right; font-weight: 500; text-transform: none; letter-spacing: normal; opacity: 0.92; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 55%; }
    .body { padding: 16px; display: flex; gap: 16px; align-items: flex-start; justify-content: space-between; }
    .body-main { display: flex; gap: 16px; flex: 1; min-width: 0; align-items: flex-start; }
    .qr-wrap { flex-shrink: 0; padding: 8px; background: #fff; border: 1px solid #f3f4f6; border-radius: 12px; }
    .qr-img { display: block; }
    .avatar { width: 72px; height: 72px; border-radius: 12px; background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; flex-shrink: 0; }
    .meta { flex: 1; min-width: 0; }
    .name { font-size: 18px; font-weight: 700; line-height: 1.2; margin: 0 0 4px; word-break: break-word; }
    .role { font-size: 12px; color: #6b7280; margin: 0 0 6px; }
    .unit { font-size: 14px; color: #1f2937; margin: 0; }
    .rid { font-size: 10px; color: #9ca3af; font-family: ui-monospace, monospace; margin: 8px 0 0; word-break: break-all; }
    .foot { padding: 10px 16px; background: #f9fafb; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #6b7280; }
    @media print { body { padding: 0; } .card { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="head"><span>Resident ID</span><span>${headerRight}</span></div>
    <div class="body">
      <div class="body-main">
        <div class="avatar">${escHtml(initials)}</div>
        <div class="meta">
          <p class="name">${escHtml(fullName)}</p>
          <p class="role">${escHtml(roleLabel)}</p>
          <p class="unit">${escHtml(unitLine)}</p>
          <p class="rid">ID: ${escHtml(resident.id)}</p>
        </div>
      </div>
      ${qrBlock}
    </div>
    <div class="foot">Powered by Kynjo.Homes</div>
  </div>
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank', 'noopener,noreferrer')
    if (!w) {
      URL.revokeObjectURL(url)
      return
    }
    w.focus()
    setTimeout(() => {
      w.print()
      w.addEventListener('afterprint', () => {
        URL.revokeObjectURL(url)
        w.close()
      })
    }, 200)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setHistoryLoading(true)
      setHistoryError(null)
      const { data, error } = await fetchJson<ResidentHistory>(`/api/residents/${resident.id}`)
      if (cancelled) return
      if (error) {
        setHistoryError(error)
        setHistory(null)
      } else {
        setHistory(data)
      }
      setHistoryLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [resident.id])

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900">Resident details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile hero */}
        <div className="px-6 py-6 flex items-center gap-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-xl font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {resident.firstName} {resident.lastName}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                ROLE_STYLES[resident.role]
              )}>
                <RoleIcon size={10} />
                {resident.role.charAt(0) + resident.role.slice(1).toLowerCase()}
              </span>
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                resident.isActive
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-500'
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  resident.isActive ? 'bg-green-500' : 'bg-red-400'
                )} />
                {resident.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 px-2 shrink-0 overflow-x-auto">
          <div className="flex min-w-0 gap-0.5">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'px-3 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                  tab === id
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab panels */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {tab === 'profile' && (
            <div className="px-6 py-4 space-y-4">
              {primaryDetails.map(({ icon: Icon, label, value, muted }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className={cn('text-sm font-medium', muted ? 'text-gray-400' : 'text-gray-900')}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                  <Calendar size={15} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Member since</p>
                  <p className="text-sm font-medium text-gray-900">{memberSinceFormatted}</p>
                </div>
              </div>

              {/* ID card — printable */}
              <div className="pt-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Resident ID card
                </p>
                <div
                  className={cn(
                    'rounded-2xl overflow-hidden border-2 border-gray-200 bg-white shadow-lg',
                    'max-w-lg mx-auto print:shadow-none print:border-gray-300'
                  )}
                >
                  <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/95">
                      Resident ID
                    </span>
                    <span className="text-[11px] text-white/85 truncate max-w-[55%] text-right">
                      {estateName ?? 'Estate member'}
                    </span>
                  </div>
                  <div className="p-4 flex gap-3 items-stretch justify-between">
                    <div className="flex gap-4 flex-1 min-w-0">
                      <div
                        className={cn(
                          'w-[4.5rem] h-[4.5rem] rounded-xl shrink-0 flex items-center justify-center',
                          'text-xl font-bold bg-brand-50 text-brand-700 border border-brand-100'
                        )}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-lg font-bold text-gray-900 leading-tight truncate">
                          {resident.firstName} {resident.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{roleLabel}</p>
                        <p className="text-sm text-gray-800 pt-0.5">{unitLine}</p>
                        <p className="text-[10px] text-gray-400 font-mono pt-1 break-all">
                          ID: {resident.id}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 p-2 bg-white border border-gray-100 rounded-xl self-center">
                      {qrValue ? (
                        <QRCodeReact value={qrValue} size={88} level="M" />
                      ) : (
                        <div className="flex h-[88px] w-[88px] items-center justify-center px-1 text-center text-[10px] text-gray-400">
                          QR unavailable
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                    {qrValue && (
                      <p className="print:hidden text-center text-[10px] font-mono leading-snug text-gray-500 break-all">
                        {qrValue}
                      </p>
                    )}
                    <p className="text-center text-[11px] text-gray-500">
                      Powered by Kynjo.Homes
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="print:hidden mt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => void openPrintIdCard()}
                      className={cn(
                        'w-full flex items-center justify-center gap-2',
                        'rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium',
                        'text-gray-700 hover:bg-gray-50 transition-colors'
                      )}
                    >
                      <Printer size={16} className="text-gray-500" />
                      Print ID card
                    </button>
                    {onResidentPatch && (
                      <button
                        type="button"
                        onClick={() => void handleRotateResidentQr()}
                        disabled={rotatingQr}
                        className={cn(
                          'w-full flex items-center justify-center gap-2',
                          'rounded-lg border border-amber-200 bg-amber-50 py-2.5 text-sm font-medium',
                          'text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50'
                        )}
                        title="Invalidates current ID card QR; print a new card"
                      >
                        <RefreshCw size={16} className={cn(rotatingQr && 'animate-spin')} />
                        {rotatingQr ? 'Rotating…' : 'Rotate QR token'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div className="px-6 py-4">
              {historyLoading && (
                <p className="text-sm text-gray-500">Loading payment history…</p>
              )}
              {historyError && !historyLoading && (
                <p className="text-sm text-red-600">{historyError}</p>
              )}
              {!historyLoading && !historyError && history && history.payments.length === 0 && (
                <p className="text-sm text-gray-500">No paid payments recorded for this resident.</p>
              )}
              {!historyLoading && history && history.payments.length > 0 && (
                <ul className="space-y-3">
                  {history.payments.map(p => (
                    <li
                      key={p.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/80 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                            <CreditCard size={15} className="text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.levy.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(p.createdAt).toLocaleDateString('en-NG', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                              {p.paidAt && (
                                <span className="text-gray-400">
                                  {' · Paid '}
                                  {new Date(p.paidAt).toLocaleDateString('en-NG', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                  })}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatMoney(p.amount, p.currency)}
                          </p>
                          <span className={cn(
                            'inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide',
                            PAYMENT_STATUS_STYLES[p.status] ?? 'bg-gray-100 text-gray-600'
                          )}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'maintenance' && (
            <div className="px-6 py-4">
              {historyLoading && (
                <p className="text-sm text-gray-500">Loading maintenance requests…</p>
              )}
              {historyError && !historyLoading && (
                <p className="text-sm text-red-600">{historyError}</p>
              )}
              {!historyLoading && !historyError && history && history.maintenanceRequests.length === 0 && (
                <p className="text-sm text-gray-500">No maintenance requests from this resident.</p>
              )}
              {!historyLoading && history && history.maintenanceRequests.length > 0 && (
                <ul className="space-y-3">
                  {history.maintenanceRequests.map(m => (
                    <li
                      key={m.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/80 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                          <Wrench size={15} className="text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{m.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{m.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-medium',
                              MAINT_STATUS_STYLES[m.status] ?? 'bg-gray-100 text-gray-600'
                            )}>
                              {m.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                              {m.category}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(m.createdAt).toLocaleDateString('en-NG', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'incidents' && (
            <div className="px-6 py-4">
              {historyLoading && (
                <p className="text-sm text-gray-500">Loading incident reports…</p>
              )}
              {historyError && !historyLoading && (
                <p className="text-sm text-red-600">{historyError}</p>
              )}
              {!historyLoading && !historyError && history && history.incidents.length === 0 && (
                <p className="text-sm text-gray-500">No incident reports from this resident.</p>
              )}
              {!historyLoading && history && history.incidents.length > 0 && (
                <ul className="space-y-3">
                  {history.incidents.map(inc => (
                    <li
                      key={inc.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/80 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                          <AlertTriangle size={15} className="text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{inc.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{inc.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-medium',
                              INCIDENT_SEVERITY_STYLES[inc.severity] ?? 'bg-gray-100 text-gray-600'
                            )}>
                              {inc.severity}
                            </span>
                            {inc.location && (
                              <span className="text-[10px] text-gray-500 truncate max-w-[12rem]">
                                {inc.location}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(inc.createdAt).toLocaleDateString('en-NG', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </span>
                            {inc.resolvedAt ? (
                              <span className="text-[10px] text-green-600 font-medium">Resolved</span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-medium">Open</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'vehicles' && (
            <div className="px-6 py-4">
              {historyLoading && (
                <p className="text-sm text-gray-500">Loading vehicles…</p>
              )}
              {historyError && !historyLoading && (
                <p className="text-sm text-red-600">{historyError}</p>
              )}
              {!historyLoading && !historyError && history && history.vehicles.length === 0 && (
                <p className="text-sm text-gray-500">No vehicles registered for this resident.</p>
              )}
              {!historyLoading && history && history.vehicles.length > 0 && (
                <ul className="space-y-3">
                  {history.vehicles.map(v => {
                    const desc = [v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'
                    return (
                      <li
                        key={v.id}
                        className="rounded-xl border border-gray-100 bg-gray-50/80 p-3"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                            <Car size={15} className="text-gray-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 tracking-wide">
                              {v.plateNumber}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {v.color && (
                                <span className="text-[10px] text-gray-500">
                                  {v.color}
                                </span>
                              )}
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-medium',
                                v.isActive
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              )}>
                                {v.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="text-xs text-gray-400">
                                Added{' '}
                                {new Date(v.createdAt).toLocaleDateString('en-NG', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Actions — profile tab only */}
        {tab === 'profile' && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onToggleActive(resident.id, resident.isActive)
                onClose()
              }}
              className={cn(
                'flex-1 rounded py-2.5 text-sm font-medium transition-colors',
                resident.isActive
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              )}
            >
              {resident.isActive ? 'Deactivate resident' : 'Reactivate resident'}
            </button>
          </div>
        )}

        {tab !== 'profile' && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 shrink-0 bg-white">
            <button
              onClick={onClose}
              className="w-full border border-gray-200 text-gray-700 rounded py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
