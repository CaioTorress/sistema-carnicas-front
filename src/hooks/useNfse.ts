import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { nfseHttp } from '../http/nfse'
import { extractPaginated } from '../http/api'
import type { Nfse, NfsePayload } from '../types/nfse'

export function useNfse(clientId: number, page = 1, perPage = 15) {
  return useQuery({
    queryKey: ['nfse', clientId, { page, perPage }],
    queryFn: async () => {
      const { data } = await nfseHttp.getByClient(clientId, { page, per_page: perPage })
      return extractPaginated<Nfse>(data)
    },
    enabled: !!clientId,
    placeholderData: keepPreviousData,
  })
}

export function useCreateNfse(clientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NfsePayload) => nfseHttp.create(clientId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nfse', clientId] }),
  })
}

export function useDeleteNfse(clientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (nfseId: number) => nfseHttp.delete(clientId, nfseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nfse', clientId] }),
  })
}
