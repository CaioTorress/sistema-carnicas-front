import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsHttp } from '../http/clients'
import type { ClientPayload } from '../types/client'

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await clientsHttp.getAll()
      return data.data
    },
  })
}

export function useClient(id: number) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data } = await clientsHttp.getById(id)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientPayload) => clientsHttp.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useUpdateClient(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ClientPayload>) => clientsHttp.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', id] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => clientsHttp.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useImportClientsCsv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => clientsHttp.importCsv(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useAddClientEmail(clientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => clientsHttp.addEmails(clientId, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useRemoveClientEmail(clientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (emailId: number) => clientsHttp.removeEmail(clientId, emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
