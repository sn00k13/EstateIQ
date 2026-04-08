import { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import DashboardTopBar from '@/components/DashboardTopBar'
import EmptyState from '@/components/EmptyState'
import { colors, fonts, radius } from '@/lib/theme'

interface Unit {
  id: string
  number: string
  block: string | null
}

interface ResidentRow {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
  unitId: string | null
  unit: Unit | null
  joinedAt: string
}

interface ResidentsPage {
  data: ResidentRow[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

const ROLES: { value: string; label: string }[] = [
  { value: 'RESIDENT', label: 'Resident' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super admin' },
]

function unitLabel(u: Unit | null) {
  if (!u) return 'No unit'
  return u.block ? `${u.block}, ${u.number}` : u.number
}

export default function ResidentsScreen() {
  const { resident: me } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = me?.role === 'ADMIN' || me?.role === 'SUPER_ADMIN'

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ResidentRow | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('RESIDENT')
  const [unitId, setUnitId] = useState<string | null>(null)
  const [unitPickerOpen, setUnitPickerOpen] = useState(false)
  const [rolePickerOpen, setRolePickerOpen] = useState(false)

  const { data: page, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ['residents', 1],
    queryFn: async () => {
      const { data, error: err } = await apiFetch<ResidentsPage>('/api/residents?page=1&limit=100')
      if (err) throw new Error(err)
      if (!data) throw new Error('Could not load residents.')
      return data
    },
    enabled: isAdmin,
  })

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error: err } = await apiFetch<Unit[]>('/api/units')
      if (err) throw new Error(err)
      return data ?? []
    },
    enabled: isAdmin,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        throw new Error('First name, last name and email are required.')
      }
      if (editing) {
        const { error } = await apiFetch(`/api/residents/${editing.id}`, {
          method: 'PATCH',
          body: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim() || null,
            unitId: unitId || null,
            role,
          },
        })
        if (error) throw new Error(error)
      } else {
        const { error } = await apiFetch('/api/residents', {
          method: 'POST',
          body: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            unitId: unitId || null,
            role,
          },
        })
        if (error) throw new Error(error)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['residents'] })
      closeModal()
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiFetch(`/api/residents/${id}`, { method: 'DELETE' })
      if (error) throw new Error(error)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['residents'] })
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  })

  const inviteMutation = useMutation({
    mutationFn: async (residentId: string) => {
      const { error } = await apiFetch('/api/residents/invite', {
        method: 'POST',
        body: { residentId },
      })
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      Alert.alert('Invite sent', 'We emailed a sign-up link to this resident.')
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  })

  const openAdd = useCallback(() => {
    setEditing(null)
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setRole('RESIDENT')
    setUnitId(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((r: ResidentRow) => {
    setEditing(r)
    setFirstName(r.firstName)
    setLastName(r.lastName)
    setEmail(r.email)
    setPhone(r.phone ?? '')
    setRole(r.role)
    setUnitId(r.unitId)
    setModalOpen(true)
  }, [])

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  if (!isAdmin) {
    return (
      <View style={styles.root}>
        <DashboardTopBar title="Residents" />
        <View style={styles.denied}>
          <Text style={styles.deniedText}>Only estate admins can manage residents.</Text>
        </View>
      </View>
    )
  }

  const list = page?.data ?? []
  const refreshing = isFetching && !isPending

  return (
    <View style={styles.root}>
      <DashboardTopBar title="Residents" />
      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {page?.total ?? '—'} {page?.total === 1 ? 'resident' : 'residents'}
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color={colors.white} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={styles.bannerErr}>{error instanceof Error ? error.message : String(error)}</Text>
      )}

      <FlatList
        data={list}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refetch()} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isPending ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand[600]} />
          ) : (
            <EmptyState
              icon="people-outline"
              title="No residents"
              subtitle="Add members to your estate or invite them by email."
            />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {item.firstName} {item.lastName}
                  {!item.isActive && (
                    <Text style={styles.inactive}> (inactive)</Text>
                  )}
                </Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.meta}>
                  {item.role.replace(/_/g, ' ')} · {unitLabel(item.unit)}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => openEdit(item)}
              >
                <Ionicons name="create-outline" size={18} color={colors.brand[600]} />
                <Text style={styles.actionLabel}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  Alert.alert(
                    'Resend invite',
                    `Send a new sign-up link to ${item.email}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Send',
                        onPress: () => inviteMutation.mutate(item.id),
                      },
                    ]
                  )
                }}
              >
                <Ionicons name="mail-outline" size={18} color={colors.gray[600]} />
                <Text style={styles.actionLabel}>Invite</Text>
              </TouchableOpacity>
              {item.isActive && item.id !== me?.id && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    Alert.alert(
                      'Deactivate',
                      `Deactivate ${item.firstName} ${item.lastName}? They can be re-added later.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          style: 'destructive',
                          text: 'Deactivate',
                          onPress: () => deactivateMutation.mutate(item.id),
                        },
                      ]
                    )
                  }}
                >
                  <Ionicons name="person-remove-outline" size={18} color={colors.red[600]} />
                  <Text style={[styles.actionLabel, { color: colors.red[600] }]}>Deactivate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Edit member' : 'Add member'}</Text>
              <TouchableOpacity onPress={closeModal} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {!editing && (
                <TextInput
                  style={styles.input}
                  placeholder="Email *"
                  placeholderTextColor={colors.gray[400]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="First name *"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Last name *"
                value={lastName}
                onChangeText={setLastName}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone (optional)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <TouchableOpacity
                style={styles.selectRow}
                onPress={() => setRolePickerOpen(true)}
              >
                <Text style={styles.selectLabel}>Role</Text>
                <Text style={styles.selectValue}>
                  {ROLES.find(r => r.value === role)?.label ?? role}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.gray[400]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.selectRow}
                onPress={() => setUnitPickerOpen(true)}
              >
                <Text style={styles.selectLabel}>Unit</Text>
                <Text style={styles.selectValue} numberOfLines={1}>
                  {unitId ? unitLabel(units.find(u => u.id === unitId) ?? null) : 'No unit'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.gray[400]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saveMutation.isPending && { opacity: 0.7 }]}
                disabled={saveMutation.isPending}
                onPress={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>{editing ? 'Save changes' : 'Add member'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={rolePickerOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setRolePickerOpen(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Role</Text>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r.value}
                style={styles.pickerRow}
                onPress={() => {
                  setRole(r.value)
                  setRolePickerOpen(false)
                }}
              >
                <Text style={styles.pickerRowText}>{r.label}</Text>
                {role === r.value && (
                  <Ionicons name="checkmark" size={20} color={colors.brand[600]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={unitPickerOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setUnitPickerOpen(false)}
        >
          <View style={[styles.pickerCard, { maxHeight: '70%' }]}>
            <Text style={styles.pickerTitle}>Unit</Text>
            <ScrollView>
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => {
                  setUnitId(null)
                  setUnitPickerOpen(false)
                }}
              >
                <Text style={styles.pickerRowText}>No unit</Text>
                {!unitId && <Ionicons name="checkmark" size={20} color={colors.brand[600]} />}
              </TouchableOpacity>
              {units.map(u => (
                <TouchableOpacity
                  key={u.id}
                  style={styles.pickerRow}
                  onPress={() => {
                    setUnitId(u.id)
                    setUnitPickerOpen(false)
                  }}
                >
                  <Text style={styles.pickerRowText}>{unitLabel(u)}</Text>
                  {unitId === u.id && (
                    <Ionicons name="checkmark" size={20} color={colors.brand[600]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.gray[50] },
  denied: { padding: 24 },
  deniedText: { fontFamily: fonts.sans, fontSize: 15, color: colors.gray[600] },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  count: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.gray[600] },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand[600],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.button,
  },
  addBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.white },
  bannerErr: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.red[600],
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 14,
    gap: 10,
  },
  cardTop: { flexDirection: 'row' },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.gray[900] },
  inactive: { fontFamily: fonts.sans, fontSize: 14, color: colors.gray[400] },
  email: { fontFamily: fonts.sans, fontSize: 13, color: colors.gray[600], marginTop: 2 },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.gray[400], marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.gray[700] },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: 16,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.gray[900] },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 15,
    marginBottom: 10,
    color: colors.gray[900],
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.card,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 10,
    gap: 8,
  },
  selectLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.gray[500], width: 56 },
  selectValue: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.gray[900] },
  saveBtn: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.white },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 12,
  },
  pickerTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  pickerRowText: { fontFamily: fonts.sans, fontSize: 15, color: colors.gray[700] },
})
