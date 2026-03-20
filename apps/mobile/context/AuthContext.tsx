import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { apiFetch } from '@/lib/api'
import { router } from 'expo-router'

interface Resident {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  estateId: string
  unit: { number: string; block: string | null } | null
}

interface AuthContextType {
  resident:  Resident | null
  token:     string | null
  signIn:    (email: string, password: string) => Promise<string | null>
  signOut:   () => Promise<void>
  loading:   boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [resident, setResident] = useState<Resident | null>(null)
  const [token, setToken]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)

  // On boot — restore session from secure storage
  useEffect(() => {
    async function restore() {
      try {
        const saved = await SecureStore.getItemAsync('session_token')
        if (saved) {
          setToken(saved)
          const { data } = await apiFetch<Resident>('/api/residents/me')
          if (data) setResident(data)
          else await clearSession()
        }
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  async function signIn(email: string, password: string): Promise<string | null> {
    const { data, error } = await apiFetch<{ token: string; resident: Resident }>(
      '/api/mobile/auth/signin',
      { method: 'POST', body: { email, password } }
    )
    if (error || !data) return error ?? 'Sign in failed'

    await SecureStore.setItemAsync('session_token', data.token)
    setToken(data.token)
    setResident(data.resident)
    return null
  }

  async function clearSession() {
    await SecureStore.deleteItemAsync('session_token')
    setToken(null)
    setResident(null)
  }

  async function signOut() {
    await clearSession()
    router.replace('/sign-in')
  }

  return (
    <AuthContext.Provider value={{ resident, token, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)