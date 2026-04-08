'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Users, CreditCard, ShieldCheck, Wrench,
  TrendingUp, Bell, CheckCircle2, Clock,
  ArrowRight, RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import { useResident } from '@/context/ResidentContext'

interface Stats {
  totalResidents:   number
  activeResidents:  number
  totalUnits:       number
  occupiedUnits:    number
  totalLevies:      number
  totalCollected:   number
  totalOutstanding: number
  collectionRate:   number
  pendingMaintenance: number
  openIncidents:    number
  visitorsToday:    number
  activePolls:      number
  recentActivity:   Activity[]
}

interface Activity {
  id:        string
  type:      string
  message:   string
  createdAt: string
}

export default function DashboardClient() {
  const { profile, isAdmin }    = useResident()
  const isSecurity              = profile?.role === 'SECURITY'
  const [stats, setStats]       = useState<Stats | null>(null)
  const [loading, setLoading]   = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async () => {
    const { data } = await fetchJson<Stats>('/api/dashboard/stats')
    if (data) {
      setStats(data)
      setLastUpdated(new Date())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 0 })
  }

  // ── Stat cards ─────────────────────────────────────────────────────
  const adminStatCards = [
    {
      label: 'Total members',
      value: stats?.totalResidents ?? 0,
      sub:   `${stats?.activeResidents ?? 0} active`,
      icon:  Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total collected',
      value: fmt(stats?.totalCollected ?? 0),
      sub:   `${stats?.collectionRate ?? 0}% collection rate`,
      icon:  TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Outstanding dues',
      value: fmt(stats?.totalOutstanding ?? 0),
      sub:   `${stats?.totalLevies ?? 0} active levies`,
      icon:  CreditCard,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Active polls',
      value: stats?.activePolls ?? 0,
      sub:   'Open for voting',
      icon:  CheckCircle2,
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  const securityStatCards = [
    {
      label: 'Visitors today',
      value: stats?.visitorsToday ?? 0,
      sub:   'Registered today',
      icon:  ShieldCheck,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Open incidents',
      value: stats?.openIncidents ?? 0,
      sub:   'Requiring attention',
      icon:  Bell,
      color: 'bg-red-50 text-red-600',
    },
    {
      label: 'Pending maintenance',
      value: stats?.pendingMaintenance ?? 0,
      sub:   'Awaiting resolution',
      icon:  Wrench,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Total members',
      value: stats?.totalResidents ?? 0,
      sub:   `${stats?.activeResidents ?? 0} active`,
      icon:  Users,
      color: 'bg-green-50 text-green-600',
    },
  ]

  const residentStatCards = [
    {
      label: 'Visitors today',
      value: stats?.visitorsToday ?? 0,
      sub:   'Registered today',
      icon:  ShieldCheck,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Pending maintenance',
      value: stats?.pendingMaintenance ?? 0,
      sub:   'Open requests',
      icon:  Wrench,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Outstanding dues',
      value: fmt(stats?.totalOutstanding ?? 0),
      sub:   'Your pending payments',
      icon:  CreditCard,
      color: 'bg-red-50 text-red-600',
    },
    {
      label: 'Active polls',
      value: stats?.activePolls ?? 0,
      sub:   'Open for voting',
      icon:  CheckCircle2,
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  const statCards = isAdmin    ? adminStatCards    :
                    isSecurity ? securityStatCards :
                    residentStatCards

  // ── Quick actions ───────────────────────────────────────────────────
  const adminQuickActions = [
    { label: 'Add member',        href: '/residents',     icon: Users       },
    { label: 'Create levy',       href: '/levies',        icon: CreditCard  },
    { label: 'New announcement',  href: '/announcements', icon: Bell        },
    { label: 'View maintenance',  href: '/maintenance',   icon: Wrench      },
  ]

  const residentQuickActions = [
    { label: 'Register visitor',  href: '/visitors',    icon: ShieldCheck },
    { label: 'Pay dues',          href: '/levies',      icon: CreditCard  },
    { label: 'Announcements',     href: '/announcements',icon: Bell       },
    { label: 'Request repair',    href: '/maintenance', icon: Wrench      },
  ]

  const quickActions = isAdmin ? adminQuickActions : residentQuickActions

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">

      {/* Welcome + refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isSecurity
              ? 'Security overview'
              : isAdmin
              ? 'Estate overview'
              : 'My dashboard'
            }
          </h2>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              Updated {lastUpdated.toLocaleTimeString('en-NG', {
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex w-fit items-center gap-1.5 self-start text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40 sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map(({ label, value, sub, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-1 truncate">{label}</p>
                  <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>
                </div>
                <div className={cn('rounded-lg p-2 shrink-0', color)}>
                  <Icon size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dues progress bar — admin only */}
      {isAdmin && stats && stats.totalCollected + stats.totalOutstanding > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-gray-900">Dues collection progress</p>
            <p className="text-sm text-gray-500">{stats.collectionRate}%</p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                stats.collectionRate >= 80 ? 'bg-green-500' :
                stats.collectionRate >= 50 ? 'bg-amber-400' : 'bg-red-400'
              )}
              style={{ width: `${stats.collectionRate}%` }}
            />
          </div>
          <div className="mt-2 flex flex-col gap-1 text-xs text-gray-400 sm:flex-row sm:justify-between sm:gap-0">
            <span>{fmt(stats.totalCollected)} collected</span>
            <span>{fmt(stats.totalOutstanding)} outstanding</span>
          </div>
        </div>
      )}

      <div className={cn(
        'grid gap-5',
        isSecurity ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'
      )}>

        {/* Quick actions — hidden for security */}
        {!isSecurity && (
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">Quick actions</p>
            <div className="space-y-2">
              {quickActions.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                      <Icon size={13} className="text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                  <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Activity feed */}
        <div className={cn(
          'bg-white border border-gray-100 rounded-xl p-5',
          isSecurity ? 'col-span-1' : 'lg:col-span-2'
        )}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-900">Recent activity</p>
            <Clock size={14} className="text-gray-300" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !stats?.recentActivity?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No recent activity yet.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell size={13} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{activity.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(activity.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}