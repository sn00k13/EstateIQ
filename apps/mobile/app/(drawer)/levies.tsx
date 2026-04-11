import {
    View, Text, ScrollView, StyleSheet,
    RefreshControl, TouchableOpacity, Alert, ActivityIndicator,
  } from 'react-native'
  import { useState } from 'react'
  import { useQuery } from '@tanstack/react-query'
  import { apiFetch } from '@/lib/api'
  import DashboardTopBar from '@/components/DashboardTopBar'
  import EmptyState from '@/components/EmptyState'
  import { colors, fonts, radius } from '@/lib/theme'
  
  interface Levy {
    id: string
    title: string
    description: string | null
    amount: number
    dueDate: string
    _count: { total: number; paid: number; pending: number }
    amountCollected: number
  }
  
  function fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
  }
  
  export default function LeviesTab() {
    const [loadingDetail, setLoadingDetail] = useState<string | null>(null)
  
    const { data, isLoading, refetch } = useQuery({
      queryKey: ['levies'],
      queryFn:  async () => {
        const { data } = await apiFetch<Levy[]>('/api/levies')
        return data ?? []
      },
    })
  
    async function handleViewLevy(levyId: string) {
      setLoadingDetail(levyId)
      const { data } = await apiFetch<any>(`/api/levies/${levyId}`)
      setLoadingDetail(null)
      if (!data) {
        Alert.alert('Error', 'Could not load levy details.')
        return
      }

      const myPayment = data.payments?.find((p: any) => p.status === 'PENDING')
      const paid = data.payments?.find((p: any) => p.status === 'PAID')
      let statusLine = 'No payment record for you on this levy.'
      if (paid) statusLine = 'Your payment: paid'
      else if (myPayment?.receiptUrl) statusLine = 'Your payment: pending approval'
      else if (myPayment) statusLine = 'Your payment: pending — pay by bank transfer (see web app for account details).'

      Alert.alert(
        data.title,
        [
          data.description ? `${data.description}\n\n` : '',
          `Amount: ${fmt(data.amount)}`,
          `\nDue: ${new Date(data.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          `\n\n${statusLine}`,
        ].join(''),
        [{ text: 'OK' }]
      )
    }
  
    return (
      <View style={styles.container}>
        <DashboardTopBar title="Levies & Dues" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        >
          {!isLoading && (!data || data.length === 0) && (
            <EmptyState icon="card-outline" title="No levies" subtitle="No levies have been created yet" />
          )}
          {data?.map(levy => {
            const pct      = levy._count.total > 0 ? Math.round((levy._count.paid / levy._count.total) * 100) : 0
            const overdue  = new Date(levy.dueDate) < new Date() && levy._count.pending > 0
            return (
              <TouchableOpacity
                key={levy.id}
                style={styles.card}
                activeOpacity={0.72}
                onPress={() => handleViewLevy(levy.id)}
                disabled={loadingDetail === levy.id}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.levyTitle}>{levy.title}</Text>
                      {overdue && (
                        <View style={styles.overdueBadge}>
                          <Text style={styles.overdueText}>Overdue</Text>
                        </View>
                      )}
                    </View>
                    {levy.description && (
                      <Text style={styles.levyDesc}>{levy.description}</Text>
                    )}
                  </View>
                  <Text style={styles.amount}>{fmt(levy.amount)}</Text>
                </View>
  
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>{levy._count.paid}/{levy._count.total} paid</Text>
                  <Text style={styles.progressPct}>{pct}%</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: pct === 100 ? colors.brand[600] : overdue ? colors.red[500] : colors.brand[500] }]} />
                </View>
  
                <Text style={styles.dueDate}>
                  Due: {new Date(levy.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>

                <View style={styles.cardFooter}>
                  {loadingDetail === levy.id ? (
                    <ActivityIndicator size="small" color={colors.brand[600]} />
                  ) : (
                    <Text style={styles.viewDetailsHint}>View details</Text>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    )
  }
  
  const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: colors.gray[50] },
    scroll:        { padding: 16, gap: 12, flexGrow: 1 },
    card:          { backgroundColor: colors.white, borderRadius: radius.card, padding: 16, borderWidth: 1, borderColor: colors.gray[100], gap: 10 },
    cardTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    titleRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    levyTitle:     { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gray[900] },
    levyDesc:      { fontFamily: fonts.sans, fontSize: 12, color: colors.gray[500], marginTop: 2 },
    amount:        { fontFamily: fonts.sansBold, fontSize: 20, color: colors.gray[900] },
    overdueBadge:  { backgroundColor: colors.red[50], paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.card },
    overdueText:   { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.red[600] },
    progressRow:   { flexDirection: 'row', justifyContent: 'space-between' },
    progressLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.gray[500] },
    progressPct:   { fontFamily: fonts.sans, fontSize: 12, color: colors.gray[500] },
    progressBg:    { height: 6, backgroundColor: colors.gray[100], borderRadius: 3, overflow: 'hidden' },
    progressFill:  { height: 6, borderRadius: 3 },
    dueDate:       { fontFamily: fonts.sans, fontSize: 12, color: colors.gray[400] },
    cardFooter:    { alignItems: 'center', paddingTop: 4 },
    viewDetailsHint: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.brand[600] },
  })