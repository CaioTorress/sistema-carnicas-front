import { AxiosError } from 'axios'
import type { ApiErrorResponse } from '../http/api'

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined
    return data?.message ?? 'Ocorreu um erro inesperado.'
  }
  return 'Ocorreu um erro inesperado.'
}
