export interface EmailDispatchItem {
  client_id: number
  document_ids: number[]
  /** Se informado, envia somente a esses destinatários; omitir = comportamento padrão (todos). */
  email_ids?: number[]
}

export interface EmailDispatchBatchPayload {
  dispatches: EmailDispatchItem[]
}
