import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { colors, fonts, radius } from '@/lib/theme'
import DashboardTopBar from '@/components/DashboardTopBar'

/** Matches `GET /api/dashboard/stats` and web `DashboardClient`. */
interface Stats {
  totalResidents: number
  activeResidents: number
  totalUnits: number
  occupiedUnits: number
  totalLevies: number
  totalCollected: number
  totalOutstanding: number
  collectionRate: number
  pendingMaintenance: number
  openIncidents: number
  visitorsToday: number
  activePolls: number
  recentActivity: Activity[]
}

interface Activity {
  id: string
  type: string
  message: string
  createdAt: string
}

function fmt(n: number) {
  return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 0 })
}

type Ion = keyof typeof Ionicons.glyphMap

export default function DashboardHomeScreen() {
  const { resident } = useAuth()
  const isAdmin =
    resident?.role === 'ADMIN' || resident?.role === 'SUPER_ADMIN'
  const isSecurity = resident?.role === 'SECURITY'

  const {
    data: stats,
    isPending,
    isFetching,
    refetch,
    error,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await apiFetch<Stats>('/api/dashboard/stats')
      if (error) throw new Error(error)
      if (!data) throw new Error('Could not load dashboard.')
      return data
    },
    refetchInterval: 60_000,
  })

  const lastUpdated =
    dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null

  const adminStatCards: {
    label: string
    value: string | number
    sub: string
    icon: Ion
    iconBg: string
    iconColor: string
  }[] = [
    {
      label: 'Total members',
      value: stats?.totalResidents ?? 0,
      sub: `${stats?.activeResidents ?? 0} active`,
      icon: 'people-outline',
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
    },
    {
      label: 'Total collected',
      value: fmt(stats?.totalCollected ?? 0),
      sub: `${stats?.collectionRate ?? 0}% collection rate`,
      icon: 'trending-up-outline',
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
    },
    {
      label: 'Outstanding dues',
      value: fmt(stats?.totalOutstanding ?? 0),
      sub: `${stats?.totalLevies ?? 0} active levies`,
      icon: 'card-outline',
      iconBg: '#fffbeb',
      iconColor: '#d97706',
    },
    {
      label: 'Active polls',
      value: stats?.activePolls ?? 0,
      sub: 'Open for voting',
      icon: 'checkmark-circle-outline',
      iconBg: '#faf5ff',
      iconColor: '#9333ea',
    },
  ]

  const securityStatCards: typeof adminStatCards = [
    {
      label: 'Visitors today',
      value: stats?.visitorsToday ?? 0,
      sub: 'Registered today',
      icon: 'shield-checkmark-outline',
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
    },
    {
      label: 'Open incidents',
      value: stats?.openIncidents ?? 0,
      sub: 'Requiring attention',
      icon: 'notifications-outline',
      iconBg: '#fef2f2',
      iconColor: '#dc2626',
    },
    {
      label: 'Pending maintenance',
      value: stats?.pendingMaintenance ?? 0,
      sub: 'Awaiting resolution',
      icon: 'construct-outline',
      iconBg: '#fffbeb',
      iconColor: '#d97706',
    },
    {
      label: 'Total members',
      value: stats?.totalResidents ?? 0,
      sub: `${stats?.activeResidents ?? 0} active`,
      icon: 'people-outline',
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
    },
  ]

  const residentStatCards: typeof adminStatCards = [
    {
      label: 'Visitors today',
      value: stats?.visitorsToday ?? 0,
      sub: 'Registered today',
      icon: 'shield-checkmark-outline',
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
    },
    {
      label: 'Pending maintenance',
      value: stats?.pendingMaintenance ?? 0,
      sub: 'Open requests',
      icon: 'construct-outline',
      iconBg: '#fffbeb',
      iconColor: '#d97706',
    },
    {
      label: 'Outstanding dues',
      value: fmt(stats?.totalOutstanding ?? 0),
      sub: 'Your pending payments',
      icon: 'card-outline',
      iconBg: '#fef2f2',
      iconColor: '#dc2626',
    },
    {
      label: 'Active polls',
      value: stats?.activePolls ?? 0,
      sub: 'Open for voting',
      icon: 'checkmark-circle-outline',
      iconBg: '#faf5ff',
      iconColor: '#9333ea',
    },
  ]

  const statCards = isAdmin
    ? adminStatCards
    : isSecurity
      ? securityStatCards
      : residentStatCards

  const adminQuickActions: { label: string; href: string; icon: Ion }[] = [
    { label: 'Add member', href: '/(drawer)/residents', icon: 'people-outline' },
    { label: 'Create levy', href: '/(drawer)/levies', icon: 'card-outline' },
    { label: 'New announcement', href: '/(drawer)/announcements', icon: 'megaphone-outline' },
    { label: 'View maintenance', href: '/(drawer)/maintenance', icon: 'construct-outline' },
  ]

  const residentQuickActions: { label: string; href: string; icon: Ion }[] = [
    { label: 'Register visitor', href: '/(drawer)/visitors', icon: 'shield-checkmark-outline' },
    { label: 'Pay dues', href: '/(drawer)/levies', icon: 'card-outline' },
    { label: 'Announcements', href: '/(drawer)/announcements', icon: 'megaphone-outline' },
    { label: 'Request repair', href: '/(drawer)/maintenance', icon: 'construct-outline' },
  ]

  const quickActions = isAdmin ? adminQuickActions : residentQuickActions

  const subtitle = isSecurity
    ? 'Security overview'
    : isAdmin
      ? 'Estate overview'
      : 'My dashboard'

  const showDuesProgress =
    isAdmin &&
    stats &&
    stats.totalCollected + stats.totalOutstanding > 0

  const refreshing = isFetching && !isPending

  return (
    <View style={styles.root}>
      <DashboardTopBar title="Dashboard" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => refetch()} />
        }
      >
        <View style={styles.sectionPad}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.subtitle}>{subtitle}</Text>
              {lastUpdated && (
                <Text style={styles.updated}>
                  Updated{' '}
                  {lastUpdated.toLocaleTimeString('en-NG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => refetch()}
              disabled={isFetching}
              style={styles.refreshBtn}
              hitSlop={8}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.gray[400]} />
              <Text style={styles.refreshLabel}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <Text style={styles.error}>
              {error instanceof Error ? error.message : String(error)}
            </Text>
          )}

          {isPending ? (
            <View style={styles.skeletonGrid}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={styles.skeletonCard} />
              ))}
            </View>
          ) : (
            <View style={styles.statGrid}>
              {statCards.map(c => (
                <View key={c.label} style={styles.statCard}>
                  <View style={styles.statRow}>
                    <View style={styles.statText}>
                      <Text style={styles.statLabel}>{c.label}</Text>
                      <Text style={styles.statValue}>{c.value}</Text>
                      <Text style={styles.statSub}>{c.sub}</Text>
                    </View>
                    <View style={[styles.statIconWrap, { backgroundColor: c.iconBg }]}>
                      <Ionicons name={c.icon} size={16} color={c.iconColor} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {showDuesProgress && stats && (
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.cardTitle}>Dues collection progress</Text>
                <Text style={styles.progressPct}>{stats.collectionRate}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, stats.collectionRate)}%`,
                      backgroundColor:
                        stats.collectionRate >= 80
                          ? '#22c55e'
                          : stats.collectionRate >= 50
                            ? '#fbbf24'
                            : '#f87171',
                    },
                  ]}
                />
              </View>
              <View style={styles.progressFoot}>
                <Text style={styles.progressFootText}>
                  {fmt(stats.totalCollected)} collected
                </Text>
                <Text style={styles.progressFootText}>
                  {fmt(stats.totalOutstanding)} outstanding
                </Text>
              </View>
            </View>
          )}

          <View style={isSecurity ? styles.colSingle : styles.twoCol}>
            {!isSecurity && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Quick actions</Text>
                <View style={styles.quickList}>
                  {quickActions.map(a => (
                    <TouchableOpacity
                      key={a.href}
                      style={styles.quickRow}
                      onPress={() => router.push(a.href as never)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.quickLeft}>
                        <View style={styles.quickIconBox}>
                          <Ionicons name={a.icon} size={14} color={colors.brand[600]} />
                        </View>
                        <Text style={styles.quickLabel}>{a.label}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={colors.gray[300]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.activityHeader}>
                <Text style={styles.cardTitle}>Recent activity</Text>
                <Ionicons name="time-outline" size={14} color={colors.gray[300]} />
              </View>
              {isPending ? (
                <View style={styles.activitySkeleton}>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={styles.activitySkeletonRow}>
                      <View style={styles.activitySkDot} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <View style={styles.activitySkLine} />
                        <View style={[styles.activitySkLine, { width: '40%' }]} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : !stats?.recentActivity?.length ? (
                <Text style={styles.emptyActivity}>No recent activity yet.</Text>
              ) : (
                <View style={styles.activityList}>
                  {stats.recentActivity.map(activity => (
                    <View key={activity.id} style={styles.activityRow}>
                      <View style={styles.activityIcon}>
                        <Ionicons name="notifications-outline" size={14} color={colors.brand[600]} />
                      </View>
                      <View style={styles.activityBody}>
                        <Text style={styles.activityMsg}>{activity.message}</Text>
                        <Text style={styles.activityTime}>
                          {new Date(activity.createdAt).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  sectionPad: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: { flex: 1 },
  subtitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    color: colors.gray[900],
  },
  updated: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 4,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  refreshLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.gray[400],
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.red[600],
  },
  skeletonGrid: { gap: 12 },
  skeletonCard: {
    height: 96,
    borderRadius: radius.card,
    backgroundColor: colors.gray[100],
  },
  statGrid: { gap: 12 },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 16,
  },
  statRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  statText: { flex: 1, minWidth: 0 },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.gray[500],
    marginBottom: 4,
  },
  statValue: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    color: colors.gray[900],
  },
  statSub: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 4,
  },
  statIconWrap: {
    borderRadius: radius.button,
    padding: 8,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressPct: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.gray[500],
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.gray[100],
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999 },
  progressFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressFootText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.gray[400],
  },
  twoCol: { gap: 20 },
  colSingle: { gap: 20 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 16,
  },
  activitySkeleton: { gap: 12 },
  activitySkeletonRow: { flexDirection: 'row', gap: 12 },
  activitySkDot: {
    width: 32,
    height: 32,
    borderRadius: radius.card,
    backgroundColor: colors.gray[100],
  },
  activitySkLine: {
    height: 12,
    borderRadius: radius.card,
    backgroundColor: colors.gray[100],
    width: '100%',
  },
  cardTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.gray[900],
    marginBottom: 12,
  },
  quickList: { gap: 4 },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.button,
  },
  quickLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickIconBox: {
    width: 28,
    height: 28,
    borderRadius: radius.button,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.gray[700],
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyActivity: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.gray[400],
    textAlign: 'center',
    paddingVertical: 28,
  },
  activityList: { gap: 12 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityBody: { flex: 1, minWidth: 0 },
  activityMsg: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  activityTime: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 4,
  },
})
