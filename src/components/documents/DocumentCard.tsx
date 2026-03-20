import { Download } from 'lucide-react'
import type { Document } from '../../types/document'
import {
  formatDate,
  daysRemainingColor,
  resolveDaysUntilExpiry,
  formatDaysUntilExpiryLabel,
} from '../../utils/formatters'
import { DocumentStatusBadge } from './DocumentStatusBadge'
import { Button } from '../ui/Button'

interface DocumentCardProps {
  document: Document
}

export function DocumentCard({ document: doc }: DocumentCardProps) {
  const daysUntil = resolveDaysUntilExpiry(doc.expires_at, doc.days_remaining)

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{doc.type}</span>
            <DocumentStatusBadge status={doc.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {doc.issued_at ? `Emitido em ${formatDate(doc.issued_at)}` : 'Não emitido'}
            {doc.expires_at && ` — Vence em ${formatDate(doc.expires_at)}`}
          </p>
          {daysUntil !== null && (
            <p className={`mt-0.5 text-sm ${daysRemainingColor(daysUntil)}`}>
              {formatDaysUntilExpiryLabel(daysUntil)}
            </p>
          )}
          {doc.error_log && (
            <p className="mt-1 text-xs text-red-600">{doc.error_log}</p>
          )}
        </div>
      </div>
      {doc.file_url && (
        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm">
            <Download size={16} />
            PDF
          </Button>
        </a>
      )}
    </div>
  )
}
