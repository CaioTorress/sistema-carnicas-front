import { Trash2 } from 'lucide-react'
import type { Nfse } from '../../types/nfse'
import { formatCurrency, formatCpfCnpj } from '../../utils/formatters'
import { Table, type Column } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface NfseListProps {
  nfseList: Nfse[]
  isLoading: boolean
  onDelete: (nfse: Nfse) => void
}

const statusVariant: Record<string, 'warning' | 'success' | 'neutral' | 'danger'> = {
  pendente: 'warning',
  emitida: 'success',
  cancelada: 'neutral',
  erro: 'danger',
}

export function NfseList({ nfseList, isLoading, onDelete }: NfseListProps) {
  const columns: Column<Nfse>[] = [
    { key: 'rps_number', header: 'Nº RPS' },
    {
      key: 'service_value',
      header: 'Valor',
      render: (row) => formatCurrency(row.service_value),
    },
    {
      key: 'buyer_cnpj',
      header: 'Tomador',
      render: (row) => (
        <div>
          <p className="text-sm">{row.buyer_name}</p>
          <p className="text-xs text-gray-500">{formatCpfCnpj(row.buyer_cnpj)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'nfse_number',
      header: 'Nº NFS-e',
      render: (row) => row.nfse_number ?? '—',
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
          <Trash2 size={16} className="text-red-500" />
        </Button>
      ),
    },
  ]

  return (
    <Table
      data={nfseList}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="Nenhuma NFS-e encontrada."
    />
  )
}
