import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { clientsHttp } from '../http/clients'
import { extractPaginated } from '../http/api'
import type { ClientListParams, SortOrder } from '../http/api'
import type { Client, ClientPayload } from '../types/client'

export interface UseClientsFilters {
  page?: number
  perPage?: number
  name?: string
  cnpj?: string
  order?: SortOrder
  orderBy?: 'name' | 'cnpj' | 'email'
}

export function useClients(filters: UseClientsFilters = {}) {
  const { page = 1, perPage = 15, name, cnpj, order, orderBy } = filters

  const params: ClientListParams = {
    page,
    per_page: perPage,
    ...(name ? { name } : {}),
    ...(cnpj ? { cnpj } : {}),
    ...(order ? { order } : {}),
    ...(orderBy ? { order_by: orderBy } : {}),
  }

  return useQuery({
    queryKey: ['clients', params],
    queryFn: async () => {
      const { data } = await clientsHttp.getAll(params)
      return extractPaginated<Client>(data)
    },
    placeholderData: keepPreviousData,
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
