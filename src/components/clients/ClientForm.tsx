import { useState, type FormEvent } from 'react'
import type { Client, ClientPayload } from '../../types/client'
import { applyCpfCnpjMask } from '../../utils/formatters'
import { useToast } from '../ui/Toast'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface ClientFormProps {
  client?: Client
  isLoading: boolean
  onSubmit: (payload: ClientPayload) => void
}

export function ClientForm({ client, isLoading, onSubmit }: ClientFormProps) {
  const { toast } = useToast()
  const [name, setName] = useState(client?.name ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [cnpj, setCnpj] = useState(client?.cnpj ?? '')
  const [idTamendes, setIdTamendes] = useState(
    client?.id_tamendes != null ? String(client.id_tamendes) : '',
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const digits = cnpj.replace(/\D/g, '')
    const idT = idTamendes.trim()
    let id_tamendes: number | null | undefined
    if (client) {
      id_tamendes = idT === '' ? null : Number(idT)
      if (idT !== '' && Number.isNaN(id_tamendes)) {
        toast('error', 'ID TaMendes deve ser um número inteiro.')
        return
      }
    } else if (idT !== '') {
      const n = Number(idT)
      if (Number.isNaN(n)) {
        toast('error', 'ID TaMendes deve ser um número inteiro.')
        return
      }
      id_tamendes = n
    }

    const payload: ClientPayload = {
      name,
      email,
      cnpj: digits,
      ...(id_tamendes !== undefined ? { id_tamendes } : {}),
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />

      <Input
        label="CPF/CNPJ"
        value={applyCpfCnpjMask(cnpj)}
        onChange={(e) => setCnpj(e.target.value.replace(/\D/g, ''))}
        required
      />

      <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

      <Input
        label="ID TaMendes (opcional)"
        inputMode="numeric"
        value={idTamendes}
        onChange={(e) => setIdTamendes(e.target.value.replace(/\D/g, ''))}
        placeholder="Deixe em branco se não houver"
      />

      <Button type="submit" isLoading={isLoading} className="w-full">
        {client ? 'Atualizar Cliente' : 'Criar Cliente'}
      </Button>
    </form>
  )
}
