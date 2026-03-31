import { api } from './api'
import type { ApiResponse } from './api'
import type { EmailDispatchBatchPayload, EmailSendPayload } from '../types/email'

function appendEmailSendFormData(form: FormData, payload: EmailSendPayload) {
  form.append('subject', payload.subject)
  form.append('body', payload.body)
  payload.to.forEach((email) => form.append('to[]', email))
  payload.client_ids.forEach((id) => form.append('client_ids[]', String(id)))
  payload.document_ids.forEach((id) => form.append('document_ids[]', String(id)))
  payload.attachments.forEach((file) => form.append('attachments[]', file))
}

export const emailHttp = {
  dispatchBatch: (payload: EmailDispatchBatchPayload) =>
    api.post<ApiResponse<null>>('/email/dispatch-batch', payload),

  send: (payload: EmailSendPayload) => {
    const form = new FormData()
    appendEmailSendFormData(form, payload)
    return api.post<ApiResponse<unknown>>('/email/send', form)
  },
}
