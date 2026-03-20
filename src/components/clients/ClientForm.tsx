import { useState, type FormEvent } from 'react'
import type { Client, ClientPayload } from '../../types/client'
import { applyCpfCnpjMask } from '../../utils/formatters'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface ClientFormProps {
  client?: Client
  isLoading: boolean
  onSubmit: (payload: ClientPayload) => void
}

export function ClientForm({ client, isLoading, onSubmit }: ClientFormProps) {
  const [name, setName] = useState(client?.name ?? '')
  const [taxId, setTaxId] = useState(client?.tax_id ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [cnpj, setCnpj] = useState(client?.cnpj ?? '')
  const [municipalRegistration, setMunicipalRegistration] = useState(client?.municipal_registration ?? '')
  const [ibgeCityCode, setIbgeCityCode] = useState(client?.ibge_city_code ?? '')
  const [gissMunicipality, setGissMunicipality] = useState(client?.giss_municipality ?? '')
  const [ibamaPassword, setIbamaPassword] = useState('')
  const [certFile, setCertFile] = useState<File | undefined>(undefined)
  const [certPassword, setCertPassword] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      tax_id: taxId.replace(/\D/g, ''),
      email,
      cnpj: cnpj.replace(/\D/g, ''),
      municipal_registration: municipalRegistration,
      ibge_city_code: ibgeCityCode,
      giss_municipality: gissMunicipality,
      ibama_password: ibamaPassword,
      cert_path: certFile,
      cert_password: certPassword,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="CPF/CNPJ (Tax ID)"
          value={applyCpfCnpjMask(taxId)}
          onChange={(e) => setTaxId(e.target.value.replace(/\D/g, ''))}
          required
        />
        <Input
          label="CNPJ"
          value={applyCpfCnpjMask(cnpj)}
          onChange={(e) => setCnpj(e.target.value.replace(/\D/g, ''))}
          required
        />
      </div>

      <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Inscrição Municipal"
          value={municipalRegistration}
          onChange={(e) => setMunicipalRegistration(e.target.value)}
          required
        />
        <Input
          label="Código IBGE"
          value={ibgeCityCode}
          onChange={(e) => setIbgeCityCode(e.target.value)}
          required
        />
      </div>

      <Input
        label="Município GissOnline"
        value={gissMunicipality}
        onChange={(e) => setGissMunicipality(e.target.value)}
        required
      />

      <Input
        label="Senha IBAMA"
        type="password"
        value={ibamaPassword}
        onChange={(e) => setIbamaPassword(e.target.value)}
        required={!client}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Certificado Digital (.pfx/.p12)</label>
        <input
          type="file"
          accept=".pfx,.p12"
          onChange={(e) => setCertFile(e.target.files?.[0])}
          className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <Input
        label="Senha do Certificado"
        type="password"
        value={certPassword}
        onChange={(e) => setCertPassword(e.target.value)}
        required={!client}
      />

      <Button type="submit" isLoading={isLoading} className="w-full">
        {client ? 'Atualizar Cliente' : 'Criar Cliente'}
      </Button>
    </form>
  )
}
