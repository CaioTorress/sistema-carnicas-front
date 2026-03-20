import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nfseHttp } from '../http/nfse'
import type { NfsePayload } from '../types/nfse'

export function useNfse(clientId: number) {
  return useQuery({
    queryKey: ['nfse', clientId],
    queryFn: async () => {
      const { data } = await nfseHttp.getByClient(clientId)
      return data.data
    },
    enabled: !!clientId,
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
