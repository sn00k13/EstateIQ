import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, RefreshControl,
  } from 'react-native'
  import { useQuery } from '@tanstack/react-query'
  import { router } from 'expo-router'
  import { Ionicons } from '@expo/vector-icons'
  import { useSafeAreaInsets } from 'react-native-safe-area-context'
  import { apiFetch } from '@/lib/api'
  import { useAuth } from '@/context/AuthContext'
  
  interface Stats {
    residents:   { total: number; units: number }
    maintenance: { open: number; inProgress: number }
    visitors:    { today: number; arrived: number }
    finances:    { outstanding: number; pendingInvoices: number }
    incidents:   { open: number; critical: number }
    polls:       { active: number }
  }
  
  function fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
  }
  
  export default function HomeTab() {
    const { resident, signOut } = useAuth()
    const insets = useSafeAreaInsets()
  
    const { data: stats, isLoading, refetch } = useQuery({
      queryKey: ['dashboard-stats'],
      queryFn:  async () => {
        const { data } = await apiFetch<Stats>('/api/dashboard/stats')
        return data
      },
      refetchInterval: 60000,
    })
  
    const isSecurity = resident?.role === 'SECURITY'
  
    const quickLinks = isSecurity
      ? [
          { label: 'Gate check-in', icon: 'shield-checkmark-outline' as const, route: '/(tabs)/gate'        },
          { label: 'Incidents',     icon: 'warning-outline'           as const, route: '/(tabs)/incidents'  },
          { label: 'Visitors',      icon: 'people-outline'            as const, route: '/(tabs)/visitors'   },
          { label: 'Notices',       icon: 'megaphone-outline'         as const, route: '/(tabs)/announcements' },
        ]
      : [
          { label: 'My levies',     icon: 'card-outline'              as const, route: '/(tabs)/levies'     },
          { label: 'Maintenance',   icon: 'construct-outline'         as const, route: '/(tabs)/maintenance' },
          { label: 'Polls',         icon: 'bar-chart-outline'         as const, route: '/(tabs)/polls'      },
          { label: 'Facilities',    icon: 'calendar-outline'          as const, route: '/(tabs)/facilities' },
        ]
  
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View>
            <Text style={styles.greeting}>
              Hello, {resident?.firstName} 👋
            </Text>
            <Text style={styles.role}>
              {resident?.role === 'SECURITY' ? 'Security Staff' :
               resident?.role === 'ADMIN'    ? 'Estate Admin'   : 'Resident'}
              {resident?.unit ? ` · ${resident.unit.block ? resident.unit.block + ', ' : ''}${resident.unit.number}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
  
        <View style={styles.content}>
  
          {/* Stats grid */}
          {stats && (
            <View style={styles.statsGrid}>
              <StatCard
                label="Visitors today"
                value={stats.visitors.today}
                sub={`${stats.visitors.arrived} inside`}
                icon="people-outline"
                color="#2563eb"
                bg="#eff6ff"
              />
              <StatCard
                label="Open maintenance"
                value={stats.maintenance.open}
                sub={`${stats.maintenance.inProgress} in progress`}
                icon="construct-outline"
                color={stats.maintenance.open > 0 ? '#dc2626' : '#16a34a'}
                bg={stats.maintenance.open > 0 ? '#fef2f2' : '#f0fdf4'}
              />
              <StatCard
                label="Outstanding dues"
                value={fmt(stats.finances.outstanding)}
                sub={`${stats.finances.pendingInvoices} invoices`}
                icon="card-outline"
                color="#d97706"
                bg="#fffbeb"
              />
              <StatCard
                label="Open incidents"
                value={stats.incidents.open}
                sub={stats.incidents.critical > 0 ? `${stats.incidents.critical} critical` : 'All clear'}
                icon="warning-outline"
                color={stats.incidents.critical > 0 ? '#dc2626' : '#6b7280'}
                bg={stats.incidents.critical > 0 ? '#fef2f2' : '#f9fafb'}
              />
            </View>
          )}
  
          {/* Quick links */}
          <Text style={styles.sectionTitle}>Quick access</Text>
          <View style={styles.quickGrid}>
            {quickLinks.map(({ label, icon, route }) => (
              <TouchableOpacity
                key={label}
                style={styles.quickItem}
                onPress={() => router.push(route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.quickIcon}>
                  <Ionicons name={icon} size={24} color="#2563eb" />
                </View>
                <Text style={styles.quickLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
  
        </View>
      </ScrollView>
    )
  }
  
  function StatCard({ label, value, sub, icon, color, bg }: {
    label: string; value: string | number; sub: string
    icon: keyof typeof Ionicons.glyphMap; color: string; bg: string
  }) {
    return (
      <View style={[styles.statCard, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statSub}>{sub}</Text>
      </View>
    )
  }
  
  const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#f9fafb' },
    header:      { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    greeting:    { fontSize: 22, fontWeight: '700', color: '#fff' },
    role:        { fontSize: 13, color: '#bfdbfe', marginTop: 2 },
    signOutBtn:  { padding: 8 },
    content:     { padding: 16 },
    statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statCard:    { width: '47%', borderRadius: 14, padding: 14, gap: 4 },
    statValue:   { fontSize: 22, fontWeight: '700', marginTop: 6 },
    statLabel:   { fontSize: 12, color: '#6b7280', fontWeight: '500' },
    statSub:     { fontSize: 11, color: '#9ca3af' },
    sectionTitle:{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
    quickGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickItem:   { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#f3f4f6' },
    quickIcon:   { width: 48, height: 48, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
    quickLabel:  { fontSize: 13, fontWeight: '500', color: '#374151', textAlign: 'center' },
  })