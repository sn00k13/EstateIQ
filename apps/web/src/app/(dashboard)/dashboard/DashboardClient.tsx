'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Users, CreditCard, ShieldCheck, Wrench,
  TrendingUp, AlertTriangle, BarChart2, CalendarCheck,
  Megaphone, Clock, RefreshCw, Building2, DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import { useSession } from 'next-auth/react'

interface Stats {
  residents:  { total: number; active: number; units: number }
  maintenance: { open: number; inProgress: number; total: number }
  visitors:   { today: number; arrived: number }
  finances:   { outstanding: number; collected: number; pendingInvoices: number; totalLevies: number }
  incidents:  { open: number; critical: number }
  polls:      { active: number }
  bookings:   { upcoming: number }
  recentAnnouncements: { id: string; title: string; priority: string; createdAt: string }[]
  recentActivity: { type: string; text: string; time: string; color: string }[]
}

const ACTIVITY_COLORS: Record<string, string> = {
  red:    'bg-red-500',
  amber:  'bg-amber-500',
  blue:   'bg-brand-500',
  green:  'bg-green-500',
  gray:   'bg-gray-400',
  orange: 'bg-orange-500',
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH:   'bg-amber-500',
  NORMAL: 'bg-blue-400',
  LOW:    'bg-gray-300',
}

function fmt(n: number) {
  return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

function timeAgo(iso: string) {
  const ms   = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="bg-gray-100 rounded-xl h-28 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-100 rounded-xl h-48 animate-pulse" />
        <div className="bg-gray-100 rounded-xl h-48 animate-pulse lg:col-span-2" />
      </div>
    </div>
  )
}

export default function DashboardClient() {
  const { data: session } = useSession()
  const [stats, setStats]           = useState<Stats | null>(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    const { data } = await fetchJson<Stats>('/api/dashboard/stats')
    if (data) {
      setStats(data)
      setLastUpdated(new Date())
    }

    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 60000)
    return () => clearInterval(interval)
  }, [load])

  const firstName = session?.user?.name?.split(' ')[0] ?? 'there'

  if (loading) return <LoadingSkeleton />
  if (!stats)  return null

  const collectionTotal = stats.finances.collected + stats.finances.outstanding
  const collectionPct   = collectionTotal > 0
    ? Math.round((stats.finances.collected / collectionTotal) * 100)
    : 0

  const bannerMessage =
    stats.incidents.critical > 0
      ? `⚠️ ${stats.incidents.critical} critical incident${stats.incidents.critical > 1 ? 's' : ''} need your attention.`
      : stats.maintenance.open > 0
      ? `${stats.maintenance.open} open maintenance request${stats.maintenance.open > 1 ? 's' : ''} awaiting action.`
      : 'Everything looks good. Here is your estate overview.'

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* ── Welcome banner ─────────────────────────────── */}
      <div className="bg-brand-600 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
            Good {getTimeOfDay()}, {firstName} 👋
          </h2>
          <p className="text-blue-100 text-sm">{bannerMessage}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <TrendingUp size={40} className="text-blue-400 hidden md:block" />
          <div className="flex items-center gap-1.5">
            {lastUpdated && (
              <span className="text-blue-200 text-xs hidden md:block">
                Updated {timeAgo(lastUpdated.toISOString())}
              </span>
            )}
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="text-blue-200 hover:text-white transition-colors"
              title="Refresh stats"
            >
              <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Primary stat cards ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <a href="/residents" className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all group">
          <div className="rounded-lg p-2.5 shrink-0 bg-brand-50 text-brand-600">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-semibold text-gray-900">{stats.residents.total}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total residents</p>
            <p className="text-xs text-gray-400">{stats.residents.units} units</p>
          </div>
        </a>

        <a href="/levies" className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all group">
          <div className={cn(
            'rounded-lg p-2.5 shrink-0',
            stats.finances.outstanding > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
          )}>
            <CreditCard size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-semibold text-gray-900 truncate">{fmt(stats.finances.outstanding)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Outstanding dues</p>
            <p className="text-xs text-gray-400">{stats.finances.pendingInvoices} unpaid invoice{stats.finances.pendingInvoices !== 1 ? 's' : ''}</p>
          </div>
        </a>

        <a href="/visitors" className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all group">
          <div className="rounded-lg p-2.5 shrink-0 bg-green-50 text-green-600">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-semibold text-gray-900">{stats.visitors.today}</p>
            <p className="text-xs text-gray-500 mt-0.5">Visitors today</p>
            <p className="text-xs text-gray-400">{stats.visitors.arrived} currently inside</p>
          </div>
        </a>

        <a href="/maintenance" className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all group">
          <div className={cn(
            'rounded-lg p-2.5 shrink-0',
            stats.maintenance.open > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          )}>
            <Wrench size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-semibold text-gray-900">{stats.maintenance.open}</p>
            <p className="text-xs text-gray-500 mt-0.5">Open maintenance</p>
            <p className="text-xs text-gray-400">{stats.maintenance.inProgress} in progress</p>
          </div>
        </a>

      </div>

      {/* ── Secondary stat cards ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <a href="/incidents" className={cn(
          'rounded-xl p-4 flex items-start gap-3 transition-all hover:shadow-sm',
          stats.incidents.critical > 0
            ? 'bg-red-50 border border-red-100 hover:border-red-200'
            : 'bg-white border border-gray-100 hover:border-gray-200'
        )}>
          <AlertTriangle size={16} className={cn('mt-0.5 shrink-0', stats.incidents.critical > 0 ? 'text-red-500' : 'text-gray-400')} />
          <div className="min-w-0">
            <p className={cn('text-xl font-semibold', stats.incidents.critical > 0 ? 'text-red-700' : 'text-gray-900')}>
              {stats.incidents.open}
            </p>
            <p className={cn('text-xs', stats.incidents.critical > 0 ? 'text-red-600' : 'text-gray-500')}>
              Security incidents
            </p>
            <p className={cn('text-xs', stats.incidents.critical > 0 ? 'text-red-400' : 'text-gray-400')}>
              {stats.incidents.critical > 0 ? `${stats.incidents.critical} critical` : 'All clear'}
            </p>
          </div>
        </a>

        <a href="/polls" className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-3 hover:border-gray-200 hover:shadow-sm transition-all">
          <BarChart2 size={16} className="text-gray-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xl font-semibold text-gray-900">{stats.polls.active}</p>
            <p className="text-xs text-gray-500">Active polls</p>
            <p className="text-xs text-gray-400">Awaiting votes</p>
          </div>
        </a>

        <a href="/facilities" className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-3 hover:border-gray-200 hover:shadow-sm transition-all">
          <CalendarCheck size={16} className="text-gray-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xl font-semibold text-gray-900">{stats.bookings.upcoming}</p>
            <p className="text-xs text-gray-500">Upcoming bookings</p>
            <p className="text-xs text-gray-400">Confirmed slots</p>
          </div>
        </a>

        <a href="/levies" className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-3 hover:border-gray-200 hover:shadow-sm transition-all">
          <DollarSign size={16} className="text-gray-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xl font-semibold text-gray-900 truncate">{fmt(stats.finances.collected)}</p>
            <p className="text-xs text-gray-500">Total collected</p>
            <p className="text-xs text-gray-400">
              {stats.finances.totalLevies} {stats.finances.totalLevies !== 1 ? 'levies' : 'levy'} created
            </p>
          </div>
        </a>

      </div>

      {/* ── Bottom grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Recent announcements + quick actions */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Megaphone size={14} className="text-brand-600" />
              Recent announcements
            </h3>
            <a href="/announcements" className="text-xs text-brand-600 hover:text-brand-700">
              View all
            </a>
          </div>

          {stats.recentAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentAnnouncements.map(a => (
                <div key={a.id} className="flex items-start gap-2.5">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                    PRIORITY_COLORS[a.priority] ?? 'bg-gray-300'
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800 font-medium truncate">{a.title}</p>
                    <p className="text-xs text-gray-400">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Quick actions</p>
            <div className="space-y-1">
              <a href="/residents" className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600 transition-colors group">
                <span>Add a resident</span>
                <span className="text-gray-300 group-hover:text-gray-500 text-xs">→</span>
              </a>
              <a href="/announcements" className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600 transition-colors group">
                <span>Create an announcement</span>
                <span className="text-gray-300 group-hover:text-gray-500 text-xs">→</span>
              </a>
              <a href="/levies" className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600 transition-colors group">
                <span>Set up a levy</span>
                <span className="text-gray-300 group-hover:text-gray-500 text-xs">→</span>
              </a>
              <a href="/visitors" className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600 transition-colors group">
                <span>Register a visitor</span>
                <span className="text-gray-300 group-hover:text-gray-500 text-xs">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              Recent activity
            </h3>
            <span className="text-xs text-gray-400">Auto-refreshes every 60s</span>
          </div>

          {stats.recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Building2 size={28} className="text-gray-200" />
              <p className="text-sm text-gray-400">No activity yet.</p>
              <p className="text-xs text-gray-300">
                Activity will appear here as your estate gets active.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full mt-1.5 shrink-0',
                    ACTIVITY_COLORS[item.color] ?? 'bg-gray-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dues collection progress */}
          {stats.finances.totalLevies > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Dues collection progress</span>
                <span className="font-medium text-gray-700">{fmt(stats.finances.collected)} collected</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-700"
                  style={{ width: `${collectionPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{fmt(stats.finances.outstanding)} outstanding</span>
                <span>{collectionPct}% collected</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}