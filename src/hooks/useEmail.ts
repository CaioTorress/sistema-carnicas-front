import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { emailHttp } from '../http/email'
import { extractPaginated } from '../http/api'
import type { SentEmail } from '../types/email'

export function useSentEmails(page = 1, perPage = 15) {
  return useQuery({
    queryKey: ['email', 'sent', { page, perPage }],
    queryFn: async () => {
      const { data } = await emailHttp.getSent({ page, per_page: perPage })
      return extractPaginated<SentEmail>(data)
    },
    placeholderData: keepPreviousData,
  })
}

export function useSentEmail(id: number) {
  return useQuery({
    queryKey: ['email', 'sent', id],
    queryFn: async () => {
      const { data } = await emailHttp.getSentById(id)
      return data.data
    },
    enabled: Number.isFinite(id) && id > 0,
  })
}
