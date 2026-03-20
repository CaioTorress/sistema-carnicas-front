import { api } from './api'
import type { ApiResponse } from './api'
import type { Nfse, NfsePayload } from '../types/nfse'

export const nfseHttp = {
  getByClient: (clientId: number) =>
    api.get<ApiResponse<Nfse[]>>(`/clients/${clientId}/nfse`),

  getById: (clientId: number, nfseId: number) =>
    api.get<ApiResponse<Nfse>>(`/clients/${clientId}/nfse/${nfseId}`),

  create: (clientId: number, payload: NfsePayload) => {
    const form = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      form.append(key, String(value))
    })
    return api.post<ApiResponse<Nfse>>(`/clients/${clientId}/nfse`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (clientId: number, nfseId: number) =>
    api.delete<ApiResponse<null>>(`/clients/${clientId}/nfse/${nfseId}`),

  importEmailsCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ApiResponse<null>>('/emails/import-csv', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
