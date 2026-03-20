import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Props {
  title: string
  back?: boolean
  right?: React.ReactNode
}

export default function ScreenHeader({ title, back, right }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {back ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.title}>{title}</Text>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 12, paddingHorizontal: 16 },
  row:       { flexDirection: 'row', alignItems: 'center' },
  backBtn:   { width: 36 },
  title:     { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#111827' },
  right:     { width: 36, alignItems: 'flex-end' },
})