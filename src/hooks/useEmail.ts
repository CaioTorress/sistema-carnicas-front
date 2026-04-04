import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { emailHttp } from '../http/email'
import { extractPaginated } from '../http/api'
import type { SentEmail } from '../types/email'

const SENT_LIST_SORT = { order: 'desc' as const, order_by: 'id' as const }

export function useSentEmails(page = 1, perPage = 10) {
  return useQuery({
    queryKey: ['email', 'sent', { page, perPage, ...SENT_LIST_SORT }],
    queryFn: async () => {
      const { data } = await emailHttp.getSent({
        page,
        per_page: perPage,
        ...SENT_LIST_SORT,
      })
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
