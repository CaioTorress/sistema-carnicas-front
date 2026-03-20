import { api } from './api'
import type { ApiResponse } from './api'
import type { EmailDispatchBatchPayload } from '../types/email'

export const emailHttp = {
  dispatchBatch: (payload: EmailDispatchBatchPayload) =>
    api.post<ApiResponse<null>>('/email/dispatch-batch', payload),
}
