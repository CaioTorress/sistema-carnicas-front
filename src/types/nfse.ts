export type NfseStatus = 'pendente' | 'emitida' | 'cancelada' | 'erro'

export interface Nfse {
  id: number
  client_id: number
  rps_number: string
  service_value: number
  service_code: string
  description: string
  buyer_cnpj: string
  buyer_name: string
  provider_cnpj: string
  municipality: string
  municipal_registration: string
  ibge_city_code: string
  nfse_number: string | null
  verification_code: string | null
  status: NfseStatus
  error_log: string | null
  created_at: string
}

export interface NfsePayload {
  rps_number: string
  service_value: number
  service_code: string
  description: string
  buyer_cnpj: string
  buyer_name: string
  provider_cnpj: string
  municipality: string
  municipal_registration: string
  ibge_city_code: string
}
