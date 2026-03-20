import { Trash2 } from 'lucide-react'
import type { Nfse } from '../../types/nfse'
import { formatCurrency } from '../../utils/formatters'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface NfseCardProps {
  nfse: Nfse
  onDelete: (nfse: Nfse) => void
}

const statusVariant: Record<string, 'warning' | 'success' | 'neutral' | 'danger'> = {
  pendente: 'warning',
  emitida: 'success',
  cancelada: 'neutral',
  erro: 'danger',
}

export function NfseCard({ nfse, onDelete }: NfseCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">RPS {nfse.rps_number}</span>
          <Badge variant={statusVariant[nfse.status]}>{nfse.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {nfse.buyer_name} — {formatCurrency(nfse.service_value)}
        </p>
        {nfse.nfse_number && (
          <p className="text-sm text-gray-500">NFS-e: {nfse.nfse_number}</p>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={() => onDelete(nfse)}>
        <Trash2 size={16} className="text-red-500" />
      </Button>
    </div>
  )
}
