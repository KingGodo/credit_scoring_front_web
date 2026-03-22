import api from '@/lib/axios'
import type {
  ApiResponse,
  LoginPayload,
  LoginResponse,
  User,
  ChangePasswordPayload,
} from '@/types'

export const authApi = {
  login: async (payload: LoginPayload) => {
    const res = await api.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      payload
    )
    return res.data.data
  },

  register: async (payload: {
    email:    string
    password: string
    role:     string
  }) => {
    const res = await api.post<ApiResponse<User>>(
      '/auth/register',
      payload
    )
    return res.data.data
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const res = await api.patch<
      ApiResponse<{ user_id: string; email: string }>
    >('/users/change-password', payload)
    return res.data.data
  },
}