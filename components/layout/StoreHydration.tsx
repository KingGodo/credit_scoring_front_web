'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'

/**
 * Mounts invisibly inside the root layout.
 * After the component mounts on the client, Zustand has already
 * rehydrated from localStorage — so we safely mark hydration complete.
 * This prevents the dashboard from redirecting to login during SSR/hydration.
 */
export function StoreHydration() {
  const setHasHydrated = useAuthStore((s) => s.setHasHydrated)
  const token          = useAuthStore((s) => s.token)

  useEffect(() => {
    // Sync token to standalone key so Axios interceptor always finds it
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
    // Mark store as hydrated — dashboard layout will now render
    setHasHydrated(true)
  }, [setHasHydrated, token])

  return null
}