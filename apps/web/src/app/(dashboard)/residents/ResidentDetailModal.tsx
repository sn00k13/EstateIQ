'use client'
import { X, Mail, Phone, Home, Shield, Calendar, User, HardHat } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface Props {
  resident: Resident
  onClose: () => void
  onToggleActive: (id: string, current: boolean) => void
}

export default function ResidentDetailModal({ resident, onClose, onToggleActive }: Props) {
  const RoleIcon = ROLE_ICONS[resident.role] ?? User
  const initials = `${resident.firstName[0]}${resident.lastName[0]}`.toUpperCase()

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

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Resident details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile hero */}
        <div className="px-6 py-6 flex items-center gap-4 border-b border-gray-100 bg-gray-50">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-xl font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {resident.firstName} {resident.lastName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
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

        {/* Detail rows */}
        <div className="px-6 py-4 space-y-4">
          {details.map(({ icon: Icon, label, value, muted }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
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

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onToggleActive(resident.id, resident.isActive)
              onClose()
            }}
            className={cn(
              'flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors',
              resident.isActive
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            )}
          >
            {resident.isActive ? 'Deactivate resident' : 'Reactivate resident'}
          </button>
        </div>
      </div>
    </div>
  )
}