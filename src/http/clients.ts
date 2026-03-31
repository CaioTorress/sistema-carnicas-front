import { api } from './api'
import type { ApiResponse, PaginatedResponse, ClientListParams } from './api'
import type { Client, ClientPayload, ClientEmailPayload } from '../types/client'

function toFormData(payload: Record<string, unknown>): FormData {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        form.append(key, value)
      } else {
        form.append(key, String(value))
      }
    }
  })
  return form
}

export const clientsHttp = {
  getAll: (params?: ClientListParams) =>
    api.get<PaginatedResponse<Client>>('/clients', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Client>>(`/clients/${id}`),

  create: (payload: ClientPayload) => {
    const form = toFormData(payload as unknown as Record<string, unknown>)
    return api.post<ApiResponse<Client>>('/clients', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  update: (id: number, payload: Partial<ClientPayload>) => {
    const form = toFormData({ ...payload, _method: 'PUT' } as unknown as Record<string, unknown>)
    return api.post<ApiResponse<Client>>(`/clients/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/clients/${id}`),

  addEmails: (id: number, payload: ClientEmailPayload) =>
    api.post<ApiResponse<null>>(`/clients/${id}/emails`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  removeEmail: (id: number, emailId: number) =>
    api.delete<ApiResponse<null>>(`/clients/${id}/emails/${emailId}`),

  importCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ApiResponse<null>>('/clients/import-csv', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
