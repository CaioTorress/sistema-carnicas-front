export interface EmailDispatchItem {
  client_id: number
  document_ids: number[]
  /** Se informado, envia somente a esses destinatários; omitir = comportamento padrão (todos). */
  email_ids?: number[]
}

export interface EmailDispatchBatchPayload {
  dispatches: EmailDispatchItem[]
}

/** Campos enviados como `multipart/form-data` em POST /email/send */
export interface EmailSendPayload {
  subject: string
  body: string
  to: string[]
  client_ids: number[]
  document_ids: number[]
  attachments: File[]
}
