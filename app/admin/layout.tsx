'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router        = useRouter()
  const user          = useAuthStore((s) => s.user)
  const token         = useAuthStore((s) => s.token)
  const _hasHydrated  = useAuthStore((s) => s._hasHydrated)

  useEffect(() => {
    // Do NOT redirect until Zustand has finished reading from localStorage.
    // Before hydration, token is null even if the user is logged in.
    if (!_hasHydrated) return

    if (!token || !user) {
      router.replace('/login')
    }
  }, [_hasHydrated, token, user, router])

  // State 1: Still hydrating — show nothing (StoreHydration sets flag instantly)
  // This state lasts ~1 frame — no visible flash
  if (!_hasHydrated) return null

  // State 2: Hydrated but no auth — redirect is in flight, show nothing
  if (!token || !user) return null

  // State 3: Authenticated — render the dashboard shell
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-screen-2xl px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}