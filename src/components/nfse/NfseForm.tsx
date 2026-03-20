import { useState, type FormEvent } from 'react'
import type { NfsePayload } from '../../types/nfse'
import { applyCpfCnpjMask, applyCurrencyMask, parseCurrencyToNumber } from '../../utils/formatters'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface NfseFormProps {
  isLoading: boolean
  onSubmit: (payload: NfsePayload) => void
}

export function NfseForm({ isLoading, onSubmit }: NfseFormProps) {
  const [rpsNumber, setRpsNumber] = useState('')
  const [serviceValue, setServiceValue] = useState('')
  const [serviceCode, setServiceCode] = useState('')
  const [description, setDescription] = useState('')
  const [buyerCnpj, setBuyerCnpj] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [providerCnpj, setProviderCnpj] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [municipalRegistration, setMunicipalRegistration] = useState('')
  const [ibgeCityCode, setIbgeCityCode] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      rps_number: rpsNumber,
      service_value: parseCurrencyToNumber(serviceValue),
      service_code: serviceCode,
      description,
      buyer_cnpj: buyerCnpj.replace(/\D/g, ''),
      buyer_name: buyerName,
      provider_cnpj: providerCnpj.replace(/\D/g, ''),
      municipality,
      municipal_registration: municipalRegistration,
      ibge_city_code: ibgeCityCode,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Número RPS"
          value={rpsNumber}
          onChange={(e) => setRpsNumber(e.target.value)}
          required
        />
        <Input
          label="Valor do Serviço"
          value={serviceValue}
          onChange={(e) => setServiceValue(applyCurrencyMask(e.target.value))}
          placeholder="R$ 0,00"
          required
        />
      </div>

      <Input
        label="Código do Serviço"
        value={serviceCode}
        onChange={(e) => setServiceCode(e.target.value)}
        required
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Discriminação</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="CNPJ do Tomador"
          value={applyCpfCnpjMask(buyerCnpj)}
          onChange={(e) => setBuyerCnpj(e.target.value.replace(/\D/g, ''))}
          required
        />
        <Input
          label="Nome do Tomador"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          required
        />
      </div>

      <Input
        label="CNPJ do Prestador"
        value={applyCpfCnpjMask(providerCnpj)}
        onChange={(e) => setProviderCnpj(e.target.value.replace(/\D/g, ''))}
        required
      />

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Município"
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          required
        />
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

      <Button type="submit" isLoading={isLoading} className="w-full">
        Emitir NFS-e
      </Button>
    </form>
  )
}
