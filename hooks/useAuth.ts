'use client'

import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const {
    user,
    token,
    isLoading,
    setAuth,
    logout,
    setLoading,
    isAuthenticated,
    isAdmin,
    isOfficer,
    hasRole,
  } = useAuthStore()

  return {
    user,
    token,
    isLoading,
    setAuth,
    logout,
    setLoading,
    isAuthenticated: isAuthenticated(),
    isAdmin:         isAdmin(),
    isOfficer:       isOfficer(),
    hasRole,
    role:            user?.role,
  }
}