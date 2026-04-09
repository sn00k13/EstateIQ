'use client'
import { useEffect, useState, useRef } from 'react'
import {
  UserPlus, Search, MoreHorizontal,
  Shield, User, HardHat, CheckCircle, XCircle,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import AddResidentModal from './AddResidentModal'
import ResidentDetailModal from './ResidentDetailModal'

interface Unit { id: string; number: string; block: string | null }
interface Resident {
  id: string; firstName: string; lastName: string
  email: string; phone: string | null; role: string
  isActive: boolean; joinedAt: string; unit: Unit | null
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

type RoleFilter = 'ALL' | 'RESIDENT' | 'ADMIN' | 'SUPER_ADMIN' | 'SECURITY'

const ROLE_TABS: { id: RoleFilter; label: string }[] = [
  { id: 'ALL',         label: 'All' },
  { id: 'RESIDENT',    label: 'Residents' },
  { id: 'SECURITY',    label: 'Security' },
  { id: 'ADMIN',       label: 'Admin' },
  { id: 'SUPER_ADMIN', label: 'Super admin' },
]

export default function ResidentsClient() {
  const [residents, setResidents]               = useState<Resident[]>([])
  const [filtered, setFiltered]                 = useState<Resident[]>([])
  const [search, setSearch]                     = useState('')
  const [roleFilter, setRoleFilter]             = useState<RoleFilter>('ALL')
  const [loading, setLoading]                   = useState(true)
  const [showAddModal, setShowAddModal]         = useState(false)
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [menuOpen, setMenuOpen]                 = useState<string | null>(null)
  const [inviting, setInviting]                 = useState<string | null>(null)
  const [exporting, setExporting]               = useState(false)
  const menuRef                                 = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    const res  = await fetch('/api/residents?all=1')
    const json = await res.json()
    const list = Array.isArray(json) ? json : (json?.data ?? [])
    setResidents(list)
    setFiltered(list)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    let list =
      roleFilter === 'ALL'
        ? residents
        : residents.filter(r => r.role === roleFilter)
    list = list.filter(r =>
      `${r.firstName} ${r.lastName} ${r.email} ${r.unit?.number ?? ''}`
        .toLowerCase()
        .includes(q)
    )
    setFiltered(list)
  }, [search, residents, roleFilter])

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/residents/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isActive: !current }),
    })
    setMenuOpen(null)
    load()
  }

  async function exportCsv() {
    setExporting(true)
    try {
      const res = await fetch('/api/residents?format=csv', { credentials: 'include' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(typeof err?.error === 'string' ? err.error : 'Export failed.')
        return
      }
      const blob = await res.blob()
      const disp = res.headers.get('Content-Disposition')
      const m = disp?.match(/filename="([^"]+)"/)
      const filename = m?.[1] ?? 'members-export.csv'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleInvite(id: string) {
    setInviting(id)
    const { error } = await fetchJson('/api/residents/invite', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ residentId: id }),
    })
    setInviting(null)
    setMenuOpen(null)
    if (error) {
      alert(error)
    } else {
      alert('Invitation email sent successfully.')
    }
  }

  const active   = residents.filter(r =>  r.isActive).length
  const inactive = residents.filter(r => !r.isActive).length

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total members', value: residents.length, color: 'text-gray-900' },
          { label: 'Active',          value: active,           color: 'text-green-600' },
          { label: 'Inactive',        value: inactive,         color: 'text-red-500'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className={cn('text-2xl font-semibold', color)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded px-3 py-2">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email or unit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm focus:outline-none bg-transparent"
          />
        </div>
        <button
          type="button"
          onClick={() => void exportCsv()}
          disabled={loading || exporting || residents.length === 0}
          className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <Download size={15} />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <UserPlus size={15} /> Add member
        </button>
      </div>

      {/* Role filter */}
      <div className="flex flex-wrap items-center gap-2">
        {ROLE_TABS.map(tab => {
          const count =
            tab.id === 'ALL'
              ? residents.length
              : residents.filter(r => r.role === tab.id).length
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                roleFilter === tab.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              {tab.label}
              <span className={cn('ml-1 tabular-nums', roleFilter === tab.id ? 'text-white/80' : 'text-gray-400')}>
                ({count})
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Resident', 'Unit', 'Role', 'Status', 'Joined', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  {search
                    ? 'No members match your search.'
                    : roleFilter !== 'ALL'
                      ? 'No members with this role.'
                      : 'No residents yet. Add one to get started.'}
                </td>
              </tr>
            )}
            {filtered.map(r => {
              const RoleIcon = ROLE_ICONS[r.role] ?? User
              const initials = `${r.firstName[0]}${r.lastName[0]}`.toUpperCase()

              return (
                <tr
                  key={r.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedResident(r)}
                >
                  {/* Name + email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {r.firstName} {r.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{r.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Unit */}
                  <td className="px-4 py-3 text-gray-600">
                    {r.unit
                      ? <span>{r.unit.block ? `${r.unit.block}, ` : ''}{r.unit.number}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>

                  {/* Role badge */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                      ROLE_STYLES[r.role]
                    )}>
                      <RoleIcon size={10} />
                      {r.role.charAt(0) + r.role.slice(1).toLowerCase()}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {r.isActive
                      ? <span className="inline-flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={12} /> Active</span>
                      : <span className="inline-flex items-center gap-1 text-red-400   text-xs"><XCircle    size={12} /> Inactive</span>
                    }
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(r.joinedAt).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>

                  {/* Three-dot menu */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="relative" ref={menuOpen === r.id ? menuRef : undefined}>
                      <button
                        onClick={() => setMenuOpen(menuOpen === r.id ? null : r.id)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreHorizontal size={15} />
                      </button>

                      {menuOpen === r.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded shadow-lg z-10 py-1 w-48">
                          <button
                            onClick={() => { setSelectedResident(r); setMenuOpen(null) }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                          >
                            View details
                          </button>
                          <button
                            onClick={() => handleInvite(r.id)}
                            disabled={inviting === r.id}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-brand-600 disabled:opacity-50"
                          >
                            {inviting === r.id ? 'Sending...' : 'Send invite email'}
                          </button>
                          <div className="my-1 border-t border-gray-100" />
                          <button
                            onClick={() => toggleActive(r.id, r.isActive)}
                            className={cn(
                              'w-full text-left px-4 py-2 text-sm hover:bg-gray-50',
                              r.isActive ? 'text-red-500' : 'text-green-600'
                            )}
                          >
                            {r.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddResidentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); load() }}
        />
      )}

      {selectedResident && (
        <ResidentDetailModal
          key={selectedResident.id}
          resident={selectedResident}
          onClose={() => setSelectedResident(null)}
          onToggleActive={(id, current) => {
            toggleActive(id, current)
            setSelectedResident(null)
          }}
          onResidentPatch={patched => setSelectedResident(patched)}
        />
      )}
    </div>
  )
}