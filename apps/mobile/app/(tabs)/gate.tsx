import {
    View, Text, StyleSheet, TextInput,
    TouchableOpacity, ActivityIndicator,
    ScrollView, Alert,
  } from 'react-native'
  import { useState } from 'react'
  import { Ionicons } from '@expo/vector-icons'
  import { useSafeAreaInsets } from 'react-native-safe-area-context'
  import { apiFetch } from '@/lib/api'
  
  interface CheckinResult {
    visitorName:  string
    purpose:      string | null
    residentName: string
    unit:         string
  }
  
  export default function GateTab() {
    const insets = useSafeAreaInsets()
    const [code, setCode]           = useState('')
    const [loading, setLoading]     = useState(false)
    const [result, setResult]       = useState<CheckinResult | null>(null)
    const [error, setError]         = useState('')
    const [checkoutId, setCheckoutId] = useState('')
    const [checkingOut, setCheckingOut] = useState(false)
  
    async function handleCheckin() {
      if (code.length !== 6) return
      setLoading(true)
      setError('')
      setResult(null)
  
      const { data, error } = await apiFetch<CheckinResult>('/api/visitors/checkin', {
        method: 'POST',
        body:   { accessCode: code },
      })
  
      setLoading(false)
      if (error) { setError(error); return }
      setResult(data)
    }
  
    async function handleCheckout() {
      if (!checkoutId.trim()) return
      setCheckingOut(true)
  
      const { error } = await apiFetch('/api/visitors/checkout', {
        method: 'POST',
        body:   { visitorId: checkoutId.trim() },
      })
  
      setCheckingOut(false)
      if (error) { Alert.alert('Error', error); return }
      Alert.alert('Done', 'Visitor exit logged successfully')
      setCheckoutId('')
    }
  
    return (
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={22} color="#fff" />
          <Text style={styles.headerTitle}>Gate check-in</Text>
        </View>
  
        <View style={styles.content}>
  
          {/* Check-in section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visitor arriving</Text>
            <Text style={styles.sectionSub}>Enter the 6-digit access code</Text>
  
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={t => {
                setCode(t.replace(/\D/g, '').slice(0, 6))
                setError('')
                setResult(null)
              }}
              placeholder="000000"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />
  
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
  
            {result && (
              <View style={styles.successBox}>
                <View style={styles.successHeader}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.successTitle}>Visitor checked in</Text>
                </View>
                <View style={styles.resultRows}>
                  <ResultRow label="Name"     value={result.visitorName}  />
                  <ResultRow label="Purpose"  value={result.purpose ?? 'Not specified'} />
                  <ResultRow label="Visiting" value={result.residentName} />
                  <ResultRow label="Unit"     value={result.unit}         />
                </View>
                <Text style={styles.notifiedText}>
                  Resident has been notified.
                </Text>
              </View>
            )}
  
            <TouchableOpacity
              style={[styles.checkinBtn, (code.length !== 6 || loading) && styles.btnDisabled]}
              onPress={handleCheckin}
              disabled={code.length !== 6 || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.checkinBtnText}>Confirm entry</Text>
              }
            </TouchableOpacity>
  
            {result && (
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => { setCode(''); setResult(null); setError('') }}
              >
                <Text style={styles.resetText}>Check in another visitor</Text>
              </TouchableOpacity>
            )}
          </View>
  
          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>visitor leaving?</Text>
            <View style={styles.dividerLine} />
          </View>
  
          {/* Checkout section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Log exit</Text>
            <TextInput
              style={styles.input}
              value={checkoutId}
              onChangeText={setCheckoutId}
              placeholder="Paste visitor ID to log exit"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              style={[styles.checkoutBtn, (!checkoutId.trim() || checkingOut) && styles.btnDisabled]}
              onPress={handleCheckout}
              disabled={!checkoutId.trim() || checkingOut}
              activeOpacity={0.8}
            >
              {checkingOut
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.checkoutBtnText}>Log exit</Text>
              }
            </TouchableOpacity>
          </View>
  
        </View>
      </ScrollView>
    )
  }
  
  function ResultRow({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>{label}</Text>
        <Text style={styles.resultValue}>{value}</Text>
      </View>
    )
  }
  
  const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: '#f9fafb' },
    header:         { backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 20, paddingBottom: 24 },
    headerTitle:    { fontSize: 20, fontWeight: '700', color: '#fff' },
    content:        { padding: 16, gap: 16 },
    section:        { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f3f4f6', gap: 12 },
    sectionTitle:   { fontSize: 16, fontWeight: '600', color: '#111827' },
    sectionSub:     { fontSize: 13, color: '#6b7280', marginTop: -8 },
    codeInput:      { borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 14, padding: 16, fontSize: 32, fontWeight: '700', color: '#111827', letterSpacing: 12, textAlign: 'center' },
    errorBox:       { flexDirection: 'row', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12 },
    errorText:      { flex: 1, fontSize: 13, color: '#dc2626' },
    successBox:     { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 14, padding: 14, gap: 10 },
    successHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
    successTitle:   { fontSize: 14, fontWeight: '600', color: '#16a34a' },
    resultRows:     { gap: 6 },
    resultRow:      { flexDirection: 'row', justifyContent: 'space-between' },
    resultLabel:    { fontSize: 13, color: '#6b7280' },
    resultValue:    { fontSize: 13, fontWeight: '500', color: '#166534' },
    notifiedText:   { fontSize: 12, color: '#16a34a' },
    checkinBtn:     { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    checkinBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    btnDisabled:    { opacity: 0.5 },
    resetBtn:       { alignItems: 'center', paddingVertical: 8 },
    resetText:      { fontSize: 13, color: '#6b7280' },
    divider:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dividerLine:    { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
    dividerText:    { fontSize: 12, color: '#9ca3af' },
    input:          { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', backgroundColor: '#f9fafb' },
    checkoutBtn:    { backgroundColor: '#374151', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    checkoutBtnText:{ color: '#fff', fontSize: 14, fontWeight: '600' },
  })