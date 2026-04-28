'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, UserRole } from '@/types'

interface AuthState {
  user:         AuthUser | null
  token:        string | null
  isLoading:    boolean
  _hasHydrated: boolean

  setAuth:        (user: AuthUser, token: string) => void
  logout:         () => void
  setLoading:     (loading: boolean) => void
  setHasHydrated: (val: boolean) => void

  isAuthenticated: () => boolean
  isAdmin:         () => boolean
  isOfficer:       () => boolean
  hasRole:         (role: UserRole) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      token:        null,
      isLoading:    false,
      _hasHydrated: false,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token)
        }
        set({ user, token })
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('loan-auth')
          document.cookie = 'token=; Max-Age=0; path=/'
          document.cookie = 'role=; Max-Age=0; path=/'
        }
        set({ user: null, token: null })
      },

      setLoading:     (loading) => set({ isLoading: loading }),
      setHasHydrated: (val)     => set({ _hasHydrated: val }),

      isAuthenticated: () => !!get().token && !!get().user,
      isAdmin:         () => get().user?.role === 'admin',
      isOfficer:       () => get().user?.role === 'loan_officer',
      hasRole:         (role) => get().user?.role === role,
    }),
    {
      name:       'loan-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)