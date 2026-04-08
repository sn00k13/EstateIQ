'use client'
import { useEffect, useState } from 'react'
import {
  X, Mail, Phone, Home, Shield, Calendar, User, HardHat,
  CreditCard, Wrench, AlertTriangle, Car,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'

interface Unit { id: string; number: string; block: string | null }
interface Resident {
  id: string; firstName: string; lastName: string
  email: string; phone: string | null; role: string
  isActive: boolean; joinedAt: string; unit: Unit | null
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

export default function ResidentDetailModal({ resident, onClose, onToggleActive }: Props) {
  const RoleIcon = ROLE_ICONS[resident.role] ?? User
  const initials = `${resident.firstName[0]}${resident.lastName[0]}`.toUpperCase()
  const [tab, setTab] = useState<TabId>('profile')
  const [historyLoading, setHistoryLoading] = useState(true)
  const [history, setHistory] = useState<ResidentHistory | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const details = [
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
    {
      icon: Calendar,
      label: 'Member since',
      value: new Date(resident.joinedAt).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'long', year: 'numeric',
      }),
    },
  ]

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
              {details.map(({ icon: Icon, label, value, muted }) => (
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
