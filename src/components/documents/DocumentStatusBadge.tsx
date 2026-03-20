import type { DocumentStatus } from '../../types/document'
import { Badge } from '../ui/Badge'

const statusConfig: Record<DocumentStatus, { label: string; variant: 'warning' | 'success' | 'neutral' | 'danger' }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  emitido: { label: 'Emitido', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'neutral' },
  erro: { label: 'Erro', variant: 'danger' },
}

interface DocumentStatusBadgeProps {
  status: DocumentStatus
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: 'neutral' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
