import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach session token to every request
api.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync('session_token')
  if (token) config.headers['x-mobile-session'] = token
  return config
})

// Generic safe fetch used throughout the app
export async function apiFetch<T>(
  url: string,
  options?: { method?: string; body?: unknown }
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await api.request<T>({
      url,
      method: options?.method ?? 'GET',
      data:   options?.body,
    })
    return { data: res.data, error: null }
  } catch (err: any) {
    const message =
      err?.response?.data?.error ??
      err?.message ??
      'Something went wrong'
    return { data: null, error: message }
  }
}