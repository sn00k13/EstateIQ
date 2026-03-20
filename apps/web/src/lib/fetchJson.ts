export async function fetchJson<T = unknown>(
    url: string,
    options?: RequestInit
  ): Promise<{ data: T | null; error: string | null; status: number }> {
    try {
      const res = await fetch(url, options)
      const text = await res.text()
  
      // Empty body — treat as error
      if (!text.trim()) {
        return { data: null, error: `Server returned empty response (${res.status})`, status: res.status }
      }
  
      let parsed: any
      try {
        parsed = JSON.parse(text)
      } catch {
        return { data: null, error: `Invalid JSON from server: ${text.slice(0, 100)}`, status: res.status }
      }
  
      if (!res.ok) {
        return { data: null, error: parsed?.error ?? `Request failed (${res.status})`, status: res.status }
      }
  
      return { data: parsed as T, error: null, status: res.status }
    } catch (err: any) {
      return { data: null, error: err.message ?? 'Network error', status: 0 }
    }
  }