import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
}

export default function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color="#d1d5db" />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title:     { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12, textAlign: 'center' },
  subtitle:  { fontSize: 13, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
})