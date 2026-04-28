import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Attach token to every request ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Try direct token key first, then fall back to Zustand persisted store
      let token = localStorage.getItem('token')

      if (!token) {
        try {
          const stored = localStorage.getItem('loan-auth')
          if (stored) {
            const parsed = JSON.parse(stored)
            token = parsed?.state?.token ?? null
          }
        } catch {
          // ignore parse errors
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Handle 401 — clear everything and go to login ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('loan-auth')
        // Clear cookies
        document.cookie = 'token=; Max-Age=0; path=/'
        document.cookie = 'role=; Max-Age=0; path=/'
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api