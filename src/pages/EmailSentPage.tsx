import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { useSentEmails } from '../hooks/useEmail'
import type { SentEmail } from '../types/email'
import { formatDate } from '../utils/formatters'
import { Header } from '../components/layout/Header'
import { Table, type Column } from '../components/ui/Table'
import { Pagination } from '../components/ui/Pagination'
import { Button } from '../components/ui/Button'

function formatRecipients(row: SentEmail): string {
  if (row.recipients?.length) return row.recipients.join(', ')
  const t = row.to
  if (Array.isArray(t)) return t.join(', ')
  if (typeof t === 'string' && t) return t
  return '—'
}

function previewBody(row: SentEmail): string {
  const raw = row.body_preview ?? row.body
  if (!raw || typeof raw !== 'string') return '—'
  const oneLine = raw.replace(/\s+/g, ' ').trim()
  return oneLine.length > 120 ? `${oneLine.slice(0, 120)}…` : oneLine
}

export function EmailSentPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, isPending, isFetching } = useSentEmails(page)
  const items = data?.items ?? []
  const meta = data?.meta

  const columns: Column<SentEmail>[] = [
    {
      key: 'subject',
      header: 'Assunto',
      render: (row) => (
        <span className="font-medium text-gray-900">{row.subject ?? '—'}</span>
      ),
    },
    {
      key: 'to',
      header: 'Destinatários',
      render: (row) => (
        <span className="max-w-md truncate text-sm text-gray-700" title={formatRecipients(row)}>
          {formatRecipients(row)}
        </span>
      ),
    },
    {
      key: 'body',
      header: 'Prévia',
      render: (row) => (
        <span className="max-w-xs truncate text-xs text-gray-500">{previewBody(row)}</span>
      ),
    },
    {
      key: 'sent_at',
      header: 'Enviado em',
      render: (row) => {
        const d = row.sent_at ?? row.created_at
        return d ? formatDate(d) : '—'
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/email/sent/${row.id}`)}
          title="Visualizar"
        >
          <Eye size={16} />
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Header
        title="Histórico de e-mails"
        subtitle={meta ? `${meta.total} envio(s) registrado(s)` : 'E-mails enviados pelo sistema'}
        actions={
          isFetching && !isPending ? (
            <span className="text-xs text-gray-400 animate-pulse">Atualizando...</span>
          ) : undefined
        }
      />

      <Table
        data={items}
        columns={columns}
        isLoading={isPending}
        emptyMessage="Nenhum e-mail enviado encontrado."
      />
      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  )
}
