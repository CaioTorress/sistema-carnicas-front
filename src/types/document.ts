export type DocumentType = 'CR' | 'AATIPP' | 'BOLETO' | 'NFSE'
export type DocumentStatus = 'pendente' | 'emitido' | 'cancelado' | 'erro'

export interface Document {
  id: number
  client_id: number
  type: DocumentType
  status: DocumentStatus
  tax_id: string
  file_url: string | null
  issued_at: string | null
  expires_at: string | null
  days_remaining: number | null
  error_log: string | null
  created_at: string
}

export interface BulkUploadSuccessItem {
  file: string
  document_id: number
  document_type: string
  client_id: number
  client_name: string
  cnpj: string
  expires_at: string
  issued_at: string
}

export interface BulkUploadErrorItem {
  file: string
  error?: string
  reason?: string
  message?: string
}

export interface BulkUploadResult {
  total_files: number
  success_count: number
  skipped_count: number
  error_count: number
  success: BulkUploadSuccessItem[]
  skipped: BulkUploadErrorItem[]
  errors: BulkUploadErrorItem[]
}
