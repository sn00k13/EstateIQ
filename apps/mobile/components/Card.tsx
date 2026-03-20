import { View, StyleSheet, ViewStyle } from 'react-native'

interface Props {
  children: React.ReactNode
  style?: ViewStyle
}

export default function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
})