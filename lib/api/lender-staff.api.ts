import api from '@/lib/axios'
import type { ApiResponse, CreateLenderStaffPayload, LenderStaff } from '@/types'

export const lenderStaffApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<LenderStaff[]>>('/lender-staff')
    return res.data.data
  },

  create: async (payload: CreateLenderStaffPayload) => {
    const res = await api.post<ApiResponse<LenderStaff>>('/lender-staff', payload)
    return res.data.data
  },
}
