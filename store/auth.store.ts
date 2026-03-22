'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, UserRole } from '@/types'

interface AuthState {
  user:      AuthUser | null
  token:     string | null
  isLoading: boolean

  // Actions
  setAuth:    (user: AuthUser, token: string) => void
  logout:     () => void
  setLoading: (loading: boolean) => void

  // Helpers
  isAuthenticated: () => boolean
  isAdmin:         () => boolean
  isOfficer:       () => boolean
  hasRole:         (role: UserRole) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:      null,
      token:     null,
      isLoading: false,

      setAuth: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token })
      },

      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null, token: null })
      },

      setLoading: (loading) => set({ isLoading: loading }),

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