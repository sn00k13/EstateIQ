import {
    View, Text, ScrollView, StyleSheet,
    RefreshControl, TouchableOpacity,
  } from 'react-native'
  import { useState } from 'react'
  import { useQuery } from '@tanstack/react-query'
  import { Ionicons } from '@expo/vector-icons'
  import { useSafeAreaInsets } from 'react-native-safe-area-context'
  import { apiFetch } from '@/lib/api'
  import EmptyState from '@/components/EmptyState'
  
  type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  
  interface Announcement {
    id: string
    title: string
    body: string
    priority: Priority
    createdAt: string
  }
  
  const PRIORITY_COLORS: Record<Priority, { bar: string; badge: string; text: string }> = {
    LOW:    { bar: '#d1d5db', badge: '#f3f4f6', text: '#6b7280' },
    NORMAL: { bar: '#60a5fa', badge: '#eff6ff', text: '#2563eb' },
    HIGH:   { bar: '#fbbf24', badge: '#fffbeb', text: '#d97706' },
    URGENT: { bar: '#ef4444', badge: '#fef2f2', text: '#dc2626' },
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
  
  export default function AnnouncementsTab() {
    const insets = useSafeAreaInsets()
    const [expanded, setExpanded] = useState<string | null>(null)
  
    const { data, isLoading, refetch } = useQuery({
      queryKey: ['announcements'],
      queryFn:  async () => {
        const { data } = await apiFetch<Announcement[]>('/api/announcements')
        return data ?? []
      },
    })
  
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Announcements</Text>
        </View>
  
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        >
          {!isLoading && (!data || data.length === 0) && (
            <EmptyState
              icon="megaphone-outline"
              title="No announcements"
              subtitle="Estate notices will appear here"
            />
          )}
  
          {data?.map(a => {
            const p          = PRIORITY_COLORS[a.priority]
            const isExpanded = expanded === a.id
            const isLong     = a.body.length > 140
  
            return (
              <View key={a.id} style={styles.card}>
                <View style={[styles.bar, { backgroundColor: p.bar }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <View style={[styles.badge, { backgroundColor: p.badge }]}>
                      <Text style={[styles.badgeText, { color: p.text }]}>
                        {a.priority.charAt(0) + a.priority.slice(1).toLowerCase()}
                      </Text>
                    </View>
                    <Text style={styles.time}>{timeAgo(a.createdAt)}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text
                    style={styles.cardBody}
                    numberOfLines={isExpanded ? undefined : 3}
                  >
                    {a.body}
                  </Text>
                  {isLong && (
                    <TouchableOpacity
                      onPress={() => setExpanded(isExpanded ? null : a.id)}
                    >
                      <Text style={styles.readMore}>
                        {isExpanded ? 'Show less' : 'Read more'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          })}
        </ScrollView>
      </View>
    )
  }
  
  const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#f9fafb' },
    header:      { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    scroll:      { padding: 16, gap: 12, flexGrow: 1 },
    card:        { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' },
    bar:         { height: 4 },
    cardContent: { padding: 14 },
    cardTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeText:   { fontSize: 11, fontWeight: '600' },
    time:        { fontSize: 11, color: '#9ca3af' },
    cardTitle:   { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 6 },
    cardBody:    { fontSize: 14, color: '#4b5563', lineHeight: 20 },
    readMore:    { fontSize: 13, color: '#2563eb', fontWeight: '500', marginTop: 6 },
  })