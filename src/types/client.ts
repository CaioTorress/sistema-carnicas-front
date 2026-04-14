export interface ClientEmail {
  id: number
  client_id: number
  email: string
  created_at: string
}

export interface Client {
  id: number
  name: string
  email: string
  cnpj: string | null
  id_tamendes: number | null
  ibama_session_expires_at: string | null
  emails: ClientEmail[]
  created_at: string
  updated_at: string
}

/** Corpo para POST /clients — name, email e cnpj obrigatórios; id_tamendes opcional. */
export interface ClientPayload {
  name: string
  email: string
  cnpj: string
  id_tamendes?: number | null
}

export interface ClientEmailPayload {
  email: string
}
