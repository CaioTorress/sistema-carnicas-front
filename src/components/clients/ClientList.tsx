import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import type { Client } from '../../types/client'
import { formatCpfCnpj } from '../../utils/formatters'
import { Table, type Column } from '../ui/Table'
import { Button } from '../ui/Button'

type SortableColumn = 'name' | 'cnpj' | 'email'

interface ClientListProps {
  clients: Client[]
  isLoading: boolean
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
  sortIcon?: (col: SortableColumn) => ReactNode
  onSort?: (col: SortableColumn) => void
}

function SortHeader({
  label,
  col,
  sortIcon,
  onSort,
}: {
  label: string
  col: SortableColumn
  sortIcon?: (col: SortableColumn) => ReactNode
  onSort?: (col: SortableColumn) => void
}) {
  if (!onSort) return <>{label}</>
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
    >
      {label}
      {sortIcon?.(col)}
    </button>
  )
}

export function ClientList({ clients, isLoading, onEdit, onDelete, sortIcon, onSort }: ClientListProps) {
  const navigate = useNavigate()

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: <SortHeader label="Nome" col="name" sortIcon={sortIcon} onSort={onSort} />,
    },
    {
      key: 'cnpj',
      header: <SortHeader label="CPF/CNPJ" col="cnpj" sortIcon={sortIcon} onSort={onSort} />,
      render: (row) => formatCpfCnpj(row.cnpj),
    },
    {
      key: 'email',
      header: <SortHeader label="E-mail(s)" col="email" sortIcon={sortIcon} onSort={onSort} />,
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm">{row.email}</p>
          {row.emails?.map((e) => (
            <p key={e.id} className="text-xs text-gray-500">{e.email}</p>
          ))}
        </div>
      ),
    },
    { key: 'giss_municipality', header: 'Município GissOnline' },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${row.id}`)}>
            <Eye size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
            <Trash2 size={16} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Table
      data={clients}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="Nenhum cliente cadastrado."
    />
  )
}
