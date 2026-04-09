import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { apiFetch } from '@/lib/api'
import DashboardTopBar from '@/components/DashboardTopBar'
import EmptyState from '@/components/EmptyState'
import { colors, fonts, radius } from '@/lib/theme'

interface Unit {
  id: string
  number: string
  block: string | null
  type: string | null
}

function unitTitle(u: Unit) {
  return u.block ? `${u.block}, ${u.number}` : u.number
}

export default function UnitsScreen() {
  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ['units', 'list'],
    queryFn: async () => {
      const { data: rows, error: err } = await apiFetch<Unit[]>('/api/units')
      if (err) throw new Error(err)
      return rows ?? []
    },
  })

  const list = data ?? []
  const refreshing = isFetching && !isPending

  return (
    <View style={styles.root}>
      <DashboardTopBar title="Units" />
      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {isPending ? '—' : list.length} {list.length === 1 ? 'unit' : 'units'}
        </Text>
      </View>

      {error && (
        <Text style={styles.bannerErr}>
          {error instanceof Error ? error.message : String(error)}
        </Text>
      )}

      <FlatList
        data={list}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => refetch()} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isPending ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand[600]} />
          ) : (
            <EmptyState
              icon="cube-outline"
              title="No units yet"
              subtitle="Units for this estate will appear here once they are added on the web app."
            />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="home-outline" size={22} color={colors.brand[600]} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.unitTitle}>{unitTitle(item)}</Text>
              {item.type ? (
                <Text style={styles.unitType} numberOfLines={2}>
                  {item.type}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.gray[50] },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  count: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.gray[600] },
  bannerErr: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.red[600],
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 14,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.card,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, minWidth: 0 },
  unitTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.gray[900],
  },
  unitType: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
})
