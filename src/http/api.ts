import axios from 'axios'

export interface ApiResponse<T> {
  title: string
  message: string
  data: T
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface PaginatedResponse<T> {
  title: string
  message: string
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorResponse {
  title: string
  message: string
}

export interface PaginationParams {
  page?: number
  per_page?: number
  [key: string]: unknown
}

export type SortOrder = 'asc' | 'desc'

export interface ClientListParams extends PaginationParams {
  name?: string
  cnpj?: string
  order?: SortOrder
  order_by?: 'name' | 'cnpj' | 'email'
}

export interface DocumentListParams extends PaginationParams {
  type?: string
  ClientName?: string
  order?: SortOrder
  order_by?: 'type' | 'status' | 'issued_at' | 'expires_at'
}

/**
 * Extrai items[] e meta de qualquer formato paginado que a API retorne.
 *
 * Formatos suportados:
 *  - { data: T[], meta: {...} }                      (Laravel API Resource)
 *  - { data: T[], current_page, last_page, ... }     (meta flat)
 *  - { data: { data: T[], meta: {...} } }             (envelope duplo)
 *  - { data: { data: T[], current_page, ... } }       (envelope duplo, meta flat)
 */
export function extractPaginated<T>(responseData: unknown): { items: T[]; meta: PaginationMeta } {
  const body = responseData as Record<string, unknown>

  const defaultMeta: PaginationMeta = { current_page: 1, last_page: 1, per_page: 15, total: 0 }

  function parseMeta(obj: Record<string, unknown>): PaginationMeta {
    const metaObj = (obj.meta ?? obj) as Record<string, unknown>
    return {
      current_page: Number(metaObj.current_page ?? 1),
      last_page: Number(metaObj.last_page ?? 1),
      per_page: Number(metaObj.per_page ?? 15),
      total: Number(metaObj.total ?? 0),
    }
  }

  if (Array.isArray(body)) {
    return { items: body as T[], meta: { ...defaultMeta, total: (body as T[]).length, per_page: (body as T[]).length || 15 } }
  }

  const dataField = body.data

  if (Array.isArray(dataField)) {
    return { items: dataField as T[], meta: parseMeta(body) }
  }

  if (dataField && typeof dataField === 'object') {
    const inner = dataField as Record<string, unknown>
    if (Array.isArray(inner.data)) {
      return { items: inner.data as T[], meta: parseMeta(inner) }
    }
  }

  return { items: [], meta: defaultMeta }
}

function currentApiUrl(): string {
  if (window.location.protocol === 'file:') return 'http://localhost:8000/api'
  const { href } = window.location

  if (href.includes('homolog')) return 'https://api-homolog.sistema-vini.com.br/api'
  if (href.includes('develop') || href.includes('localhost')) return 'http://localhost:8000/api'

  return 'https://api.sistema-vini.com.br/api'
}

export const api = axios.create({
  baseURL: currentApiUrl(),
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Paginated'] = 'True'
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.hash = '/login'
    }
    return Promise.reject(error)
  },
)
