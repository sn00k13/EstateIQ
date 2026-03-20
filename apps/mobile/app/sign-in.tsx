import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ActivityIndicator, ScrollView,
  } from 'react-native'
  import { useState } from 'react'
  import { router } from 'expo-router'
  import { useAuth } from '@/context/AuthContext'
  import { StatusBar } from 'expo-status-bar'
  
  export default function SignInScreen() {
    const { signIn } = useAuth()
    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading]   = useState(false)
    const [error, setError]       = useState('')
  
    async function handleSignIn() {
      if (!email.trim() || !password.trim()) {
        setError('Please enter your email and password')
        return
      }
      setLoading(true)
      setError('')
      const err = await signIn(email.trim(), password.trim())
      setLoading(false)
      if (err) { setError(err); return }
      router.replace('/(tabs)')
    }
  
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo area */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>EQ</Text>
            </View>
            <Text style={styles.appName}>EstateIQ</Text>
            <Text style={styles.tagline}>Smart estate management</Text>
          </View>
  
          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
  
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
  
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
  
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
            </View>
  
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Sign in</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }
  
  const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#2563eb' },
    scroll:      { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header:      { alignItems: 'center', marginBottom: 32 },
    logoBox:     { width: 64, height: 64, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    logoText:    { fontSize: 24, fontWeight: '700', color: '#2563eb' },
    appName:     { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
    tagline:     { fontSize: 14, color: '#bfdbfe' },
    card:        { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
    title:       { fontSize: 22, fontWeight: '600', color: '#111827', marginBottom: 4 },
    subtitle:    { fontSize: 14, color: '#6b7280', marginBottom: 20 },
    errorBox:    { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16 },
    errorText:   { color: '#dc2626', fontSize: 13 },
    field:       { marginBottom: 16 },
    label:       { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
    input:       { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb' },
    button:      { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    buttonDisabled: { opacity: 0.6 },
    buttonText:  { color: '#fff', fontSize: 15, fontWeight: '600' },
  })