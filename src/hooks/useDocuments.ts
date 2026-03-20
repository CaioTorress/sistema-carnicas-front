import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsHttp } from '../http/documents'
import type { Document } from '../types/document'
import { isExpiringWithinDays } from '../utils/formatters'

export function useDocuments(clientId: number) {
  return useQuery({
    queryKey: ['documents', clientId],
    queryFn: async () => {
      const { data } = await documentsHttp.getByClient(clientId)
      return data.data
    },
    enabled: !!clientId,
  })
}

export function useEmitirCr(clientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => documentsHttp.emitirCr(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', clientId] }),
  })
}

export function useEmitirAatipp(clientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => documentsHttp.emitirAatipp(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', clientId] }),
  })
}

export function useUploadDocument(clientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => documentsHttp.uploadDocument(clientId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', clientId] }),
  })
}

/** Agrega documentos de todos os clientes e conta quantos têm `expires_at` nos próximos N dias (inclusive hoje). */
export function useExpiringDocumentsCount(clientIds: number[], windowDays: number) {
  const queries = useQueries({
    queries: clientIds.map((id) => ({
      queryKey: ['documents', id] as const,
      queryFn: async () => {
        const { data } = await documentsHttp.getByClient(id)
        return data.data
      },
      enabled: clientIds.length > 0,
    })),
  })

  const allDocuments: Document[] = queries.flatMap((q) => q.data ?? [])
  const count = allDocuments.filter((doc) =>
    isExpiringWithinDays(doc.expires_at, windowDays),
  ).length

  const isPending = clientIds.length > 0 && queries.some((q) => q.isPending)

  return { count, isPending }
}

/** Lista todos os documentos agregando `GET /clients/:id/documents` por cliente. */
export function useAllDocuments(clientIds: number[]) {
  const queries = useQueries({
    queries: clientIds.map((id) => ({
      queryKey: ['documents', id] as const,
      queryFn: async () => {
        const { data } = await documentsHttp.getByClient(id)
        return data.data
      },
      enabled: clientIds.length > 0,
    })),
  })

  const documents: Document[] = queries.flatMap((q) => q.data ?? [])
  const isPending = clientIds.length > 0 && queries.some((q) => q.isPending)

  return { documents, isPending }
}
