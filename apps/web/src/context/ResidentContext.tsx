'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { fetchJson } from '@/lib/fetchJson'

interface ResidentProfile {
  id:        string
  firstName: string
  lastName:  string
  role:      string
  estateId:  string
  unit:      { number: string; block: string | null } | null
}

interface ResidentContextType {
  profile:  ResidentProfile | null
  loading:  boolean
  isAdmin:  boolean
}

const ResidentContext = createContext<ResidentContextType>({
  profile: null,
  loading: true,
  isAdmin: false,
})

export function ResidentProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ResidentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await fetchJson<ResidentProfile>('/api/residents/me')
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN'

  return (
    <ResidentContext.Provider value={{ profile, loading, isAdmin }}>
      {children}
    </ResidentContext.Provider>
  )
}

export const useResident = () => useContext(ResidentContext)