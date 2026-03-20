import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import type { Client } from '../../types/client'
import { formatCpfCnpj } from '../../utils/formatters'
import { Button } from '../ui/Button'

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <p className="font-semibold text-gray-900">{client.name}</p>
        <p className="text-sm text-gray-500">{formatCpfCnpj(client.cnpj)}</p>
        <p className="text-sm text-gray-500">{client.email}</p>
        {client.emails?.map((e) => (
          <p key={e.id} className="text-xs text-gray-400">{e.email}</p>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${client.id}`)}>
          <Eye size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>
          <Pencil size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(client)}>
          <Trash2 size={16} className="text-red-500" />
        </Button>
      </div>
    </div>
  )
}
