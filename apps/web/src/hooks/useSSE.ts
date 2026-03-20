'use client'
import { useEffect, useRef } from 'react'

type SSEHandler = (data: any) => void

export function useSSE(handlers: Record<string, SSEHandler>) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    let es: EventSource
    let retryTimeout: ReturnType<typeof setTimeout>
    let pingInterval: ReturnType<typeof setInterval>
    let residentId: string | null = null
    let retries = 0

    function connect() {
      es = new EventSource('/api/sse')

      es.addEventListener('connected', (e: MessageEvent) => {
        retries = 0
        try {
          residentId = JSON.parse(e.data).residentId
        } catch {}
      })

      es.addEventListener('heartbeat', () => {
        // connection confirmed alive — nothing to do
      })

      // Register every event type the caller cares about
      Object.keys(handlersRef.current).forEach(event => {
        es.addEventListener(event, (e: MessageEvent) => {
          try {
            handlersRef.current[event]?.(JSON.parse(e.data))
          } catch {}
        })
      })

      es.onerror = () => {
        es.close()
        // Exponential backoff: 1s → 2s → 4s → … → max 30s
        const delay = Math.min(1000 * Math.pow(2, retries), 30000)
        retries++
        retryTimeout = setTimeout(connect, delay)
      }
    }

    connect()

    // Ping every 25 seconds to keep the connection alive
    pingInterval = setInterval(() => {
      if (residentId) {
        fetch('/api/sse/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ residentId }),
        }).catch(() => {})
      }
    }, 25000)

    return () => {
      clearTimeout(retryTimeout)
      clearInterval(pingInterval)
      es?.close()
    }
  }, [])
}