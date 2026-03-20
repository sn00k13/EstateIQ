import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert,
  } from 'react-native'
  import { router } from 'expo-router'
  import { Ionicons } from '@expo/vector-icons'
  import { useSafeAreaInsets } from 'react-native-safe-area-context'
  import { useAuth } from '@/context/AuthContext'
  
  const menuItems = [
    { label: 'Levies & Dues',      icon: 'card-outline'               as const, route: '/(tabs)/levies'      },
    { label: 'Maintenance',        icon: 'construct-outline'          as const, route: '/(tabs)/maintenance' },
    { label: 'Polls & Voting',     icon: 'bar-chart-outline'          as const, route: '/(tabs)/polls'       },
    { label: 'Facilities',         icon: 'calendar-outline'           as const, route: '/(tabs)/facilities'  },
    { label: 'Security Incidents', icon: 'warning-outline'            as const, route: '/(tabs)/incidents'   },
  ]
  
  export default function MoreTab() {
    const insets         = useSafeAreaInsets()
    const { resident, signOut } = useAuth()
  
    function handleSignOut() {
      Alert.alert('Sign out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: signOut },
      ])
    }
  
    return (
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Profile card */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {resident?.firstName?.charAt(0)}{resident?.lastName?.charAt(0)}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>
              {resident?.firstName} {resident?.lastName}
            </Text>
            <Text style={styles.profileRole}>
              {resident?.role === 'SECURITY' ? 'Security Staff' :
               resident?.role === 'ADMIN'    ? 'Estate Admin'   : 'Resident'}
            </Text>
            {resident?.unit && (
              <Text style={styles.profileUnit}>
                {resident.unit.block ? `${resident.unit.block}, ` : ''}{resident.unit.number}
              </Text>
            )}
          </View>
        </View>
  
        {/* Menu items */}
        <View style={styles.menu}>
          <Text style={styles.sectionLabel}>Features</Text>
          {menuItems.map(({ label, icon, route }) => (
            <TouchableOpacity
              key={label}
              style={styles.menuItem}
              onPress={() => router.push(route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={icon} size={20} color="#2563eb" />
              </View>
              <Text style={styles.menuLabel}>{label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>
  
        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }
  
  const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#f9fafb' },
    profile:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#2563eb', padding: 20, paddingBottom: 28 },
    avatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    avatarText:   { fontSize: 18, fontWeight: '700', color: '#2563eb' },
    profileName:  { fontSize: 18, fontWeight: '600', color: '#fff' },
    profileRole:  { fontSize: 13, color: '#bfdbfe', marginTop: 2 },
    profileUnit:  { fontSize: 12, color: '#93c5fd', marginTop: 1 },
    menu:         { margin: 16 },
    sectionLabel: { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6' },
    menuIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
    menuLabel:    { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
    signOutBtn:   { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#fee2e2' },
    signOutText:  { fontSize: 15, color: '#dc2626', fontWeight: '500' },
  })