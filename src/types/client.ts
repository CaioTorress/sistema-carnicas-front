export interface ClientEmail {
  id: number
  client_id: number
  email: string
  created_at: string
}

export interface Client {
  id: number
  name: string
  tax_id: string
  email: string
  cnpj: string
  municipal_registration: string
  ibge_city_code: string
  giss_municipality: string
  emails: ClientEmail[]
  created_at: string
  updated_at: string
}

export interface ClientPayload {
  name: string
  tax_id: string
  email: string
  cnpj: string
  municipal_registration: string
  ibge_city_code: string
  giss_municipality: string
  ibama_password: string
  cert_path?: File
  cert_password: string
}

export interface ClientEmailPayload {
  email: string
}
