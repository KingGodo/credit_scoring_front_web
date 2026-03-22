import api from '@/lib/axios'
import type { ApiResponse, Lender, CreateLenderPayload } from '@/types'

export const lendersApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Lender[]>>('/lenders')
    return res.data.data
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Lender>>(`/lenders/${id}`)
    return res.data.data
  },

  create: async (payload: CreateLenderPayload) => {
    const res = await api.post<ApiResponse<Lender>>('/lenders', payload)
    return res.data.data
  },

  update: async (id: string, payload: Partial<CreateLenderPayload>) => {
    const res = await api.put<ApiResponse<Lender>>(`/lenders/${id}`, payload)
    return res.data.data
  },

  delete: async (id: string) => {
    await api.delete(`/lenders/${id}`)
  },
}