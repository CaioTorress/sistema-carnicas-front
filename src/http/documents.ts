import { api } from './api'
import type { ApiResponse } from './api'
import type { Document, BulkUploadResult } from '../types/document'

export const documentsHttp = {
  getByClient: (clientId: number) =>
    api.get<ApiResponse<Document[]>>(`/clients/${clientId}/documents`),

  getById: (clientId: number, documentId: number) =>
    api.get<ApiResponse<Document>>(`/clients/${clientId}/documents/${documentId}`),

  emitirCr: (clientId: number) =>
    api.post<ApiResponse<Document>>(`/clients/${clientId}/cr`),

  emitirAatipp: (clientId: number) =>
    api.post<ApiResponse<Document>>(`/clients/${clientId}/aatipp`),

  uploadDocument: (clientId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ApiResponse<Document>>(`/clients/${clientId}/documents/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  bulkUpload: (files: File[]) => {
    const form = new FormData()
    files.forEach((file) => form.append('files[]', file))
    return api.post<ApiResponse<BulkUploadResult>>('/documents/bulk-upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
