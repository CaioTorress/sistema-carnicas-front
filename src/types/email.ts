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

/** Registro retornado por GET /sent-emails e GET /sent-emails/:id */
export interface SentEmail {
  id: number
  subject?: string | null
  body?: string | null
  body_preview?: string | null
  to?: string | string[] | null
  recipients?: string[] | null
  sent_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}
