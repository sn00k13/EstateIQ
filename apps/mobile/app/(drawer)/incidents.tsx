import {
    View, Text, ScrollView, StyleSheet,
    RefreshControl, TouchableOpacity, Modal,
    TextInput, Alert, ActivityIndicator,
  } from 'react-native'
  import { useState } from 'react'
  import { useQuery, useQueryClient } from '@tanstack/react-query'
  import { Ionicons } from '@expo/vector-icons'
  import { apiFetch } from '@/lib/api'
  import DashboardTopBar from '@/components/DashboardTopBar'
  import EmptyState from '@/components/EmptyState'
  import { radius } from '@/lib/theme'
  
  type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  
  interface Incident {
    id: string
    title: string
    description: string
    severity: Severity
    location: string | null
    resolvedAt: string | null
    createdAt: string
  }
  
  const SEV_COLORS: Record<Severity, { bar: string; badge: string; text: string }> = {
    LOW:      { bar: '#d1d5db', badge: '#f3f4f6', text: '#6b7280'  },
    MEDIUM:   { bar: '#fbbf24', badge: '#fffbeb', text: '#d97706'  },
    HIGH:     { bar: '#f97316', badge: '#fff7ed', text: '#ea580c'  },
    CRITICAL: { bar: '#ef4444', badge: '#fef2f2', text: '#dc2626'  },
  }
  
  export default function IncidentsTab() {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving]       = useState(false)
    const [form, setForm] = useState({ title: '', description: '', severity: 'MEDIUM' as Severity, location: '' })
  
    const { data, isLoading, refetch } = useQuery({
      queryKey: ['incidents'],
      queryFn:  async () => {
        const { data } = await apiFetch<Incident[]>('/api/incidents')
        return data ?? []
      },
    })
  
    async function handleSubmit() {
      if (!form.title.trim() || !form.description.trim()) {
        Alert.alert('Required', 'Title and description are required')
        return
      }
      setSaving(true)
      const { error } = await apiFetch('/api/incidents', {
        method: 'POST',
        body: form,
      })
      setSaving(false)
      if (error) { Alert.alert('Error', error); return }
      setShowModal(false)
      setForm({ title: '', description: '', severity: 'MEDIUM', location: '' })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
    }
  
    return (
      <View style={styles.container}>
        <DashboardTopBar
          title="Security Incidents"
          right={
            <TouchableOpacity onPress={() => setShowModal(true)} hitSlop={8}>
              <Ionicons name="add-circle" size={26} color="#dc2626" />
            </TouchableOpacity>
          }
        />
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        >
          {!isLoading && (!data || data.length === 0) && (
            <EmptyState icon="warning-outline" title="No incidents" subtitle="No security incidents reported" />
          )}
          {data?.map(inc => {
            const sc         = SEV_COLORS[inc.severity]
            const isResolved = !!inc.resolvedAt
            return (
              <View key={inc.id} style={[styles.card, isResolved && { opacity: 0.7 }]}>
                <View style={[styles.bar, { backgroundColor: sc.bar }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <Text style={styles.incTitle}>{inc.title}</Text>
                    <View style={[styles.badge, { backgroundColor: sc.badge }]}>
                      <Text style={[styles.badgeText, { color: sc.text }]}>
                        {inc.severity.charAt(0) + inc.severity.slice(1).toLowerCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.incDesc} numberOfLines={2}>{inc.description}</Text>
                  <View style={styles.cardFooter}>
                    {inc.location && <Text style={styles.location}>📍 {inc.location}</Text>}
                    <Text style={styles.date}>
                      {new Date(inc.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </Text>
                    {isResolved && (
                      <View style={styles.resolvedBadge}>
                        <Text style={styles.resolvedText}>Resolved</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )
          })}
        </ScrollView>
  
        <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report incident</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={styles.label}>Title *</Text>
                <TextInput style={styles.input} value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} placeholder="e.g. Suspicious person at main gate" placeholderTextColor="#9ca3af" />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.input} value={form.location} onChangeText={t => setForm(p => ({ ...p, location: t }))} placeholder="e.g. Main gate, Oak Avenue" placeholderTextColor="#9ca3af" />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Severity</Text>
                <View style={styles.sevRow}>
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Severity[]).map(s => (
                    <TouchableOpacity key={s} style={[styles.sevBtn, form.severity === s && { backgroundColor: SEV_COLORS[s].bar, borderColor: SEV_COLORS[s].bar }]} onPress={() => setForm(p => ({ ...p, severity: s }))}>
                      <Text style={[styles.sevBtnText, form.severity === s && { color: '#fff' }]}>{s.charAt(0) + s.slice(1).toLowerCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Description *</Text>
                <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} placeholder="Describe what happened..." placeholderTextColor="#9ca3af" multiline />
              </View>
              <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit report</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    )
  }
  
  const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: '#f9fafb' },
    scroll:        { padding: 16, gap: 10, flexGrow: 1 },
    card:          { backgroundColor: '#fff', borderRadius: radius.card, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' },
    bar:           { height: 4 },
    cardContent:   { padding: 14, gap: 8 },
    cardTop:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    incTitle:      { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
    badge:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.card },
    badgeText:     { fontSize: 11, fontWeight: '600' },
    incDesc:       { fontSize: 13, color: '#6b7280', lineHeight: 18 },
    cardFooter:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    location:      { fontSize: 12, color: '#6b7280', flex: 1 },
    date:          { fontSize: 12, color: '#9ca3af' },
    resolvedBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.card },
    resolvedText:  { fontSize: 11, color: '#16a34a', fontWeight: '600' },
    modal:         { flex: 1, backgroundColor: '#fff' },
    modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    modalTitle:    { fontSize: 18, fontWeight: '600', color: '#111827' },
    modalBody:     { padding: 20 },
    field:         { marginBottom: 18 },
    label:         { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
    input:         { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: radius.card, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb' },
    sevRow:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    sevBtn:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.button, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
    sevBtnText:    { fontSize: 13, color: '#374151' },
    submitBtn:     { backgroundColor: '#dc2626', borderRadius: radius.button, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText:    { color: '#fff', fontSize: 15, fontWeight: '600' },
  })