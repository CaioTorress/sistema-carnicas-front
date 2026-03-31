import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { documentsHttp } from '../http/documents'
import { extractPaginated } from '../http/api'
import type { DocumentListParams, SortOrder } from '../http/api'
import type { Document } from '../types/document'
import { isExpiringWithinDays } from '../utils/formatters'

export interface UseDocumentsFilters {
  page?: number
  perPage?: number
  type?: string
  clientName?: string
  order?: SortOrder
  orderBy?: 'type' | 'status' | 'issued_at' | 'expires_at'
}

/** Lista documentos paginados via `GET /documents`. */
export function useAllDocuments(filters: UseDocumentsFilters = {}) {
  const { page = 1, perPage = 15, type, clientName, order, orderBy } = filters

  const params: DocumentListParams = {
    page,
    per_page: perPage,
    ...(type ? { type } : {}),
    ...(clientName ? { ClientName: clientName } : {}),
    ...(order ? { order } : {}),
    ...(orderBy ? { order_by: orderBy } : {}),
  }

  return useQuery({
    queryKey: ['documents', params],
    queryFn: async () => {
      const { data } = await documentsHttp.getAll(params)
      return extractPaginated<Document>(data)
    },
    placeholderData: keepPreviousData,
  })
}

/** Documentos de um cliente (busca página grande e filtra localmente). */
export function useDocuments(clientId: number) {
  return useQuery({
    queryKey: ['documents', 'client', clientId],
    queryFn: async () => {
      const { data } = await documentsHttp.getAll({ page: 1, per_page: 100 })
      const { items } = extractPaginated<Document>(data)
      return items.filter((d) => d.client_id === clientId)
    },
    enabled: !!clientId,
  })
}

/** Conta quantos documentos vencendo nos próximos N dias. */
export function useExpiringDocumentsCount(windowDays: number) {
  const { data, isPending } = useQuery({
    queryKey: ['documents', 'expiring', windowDays],
    queryFn: async () => {
      const { data } = await documentsHttp.getAll({ page: 1, per_page: 1000 })
      return extractPaginated<Document>(data).items
    },
  })
  const count = (data ?? []).filter((doc) =>
    isExpiringWithinDays(doc.expires_at, windowDays),
  ).length
  return { count, isPending }
}

export function useEmitirCr(clientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => documentsHttp.emitirCr(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useEmitirAatipp(clientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => documentsHttp.emitirAatipp(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useUploadDocument(clientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => documentsHttp.uploadDocument(clientId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })
}
