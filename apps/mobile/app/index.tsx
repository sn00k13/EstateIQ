import { Redirect } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const { resident, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return resident ? <Redirect href="/(tabs)" /> : <Redirect href="/sign-in" />
}