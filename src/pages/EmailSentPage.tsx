import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Eye, RotateCw } from 'lucide-react'
import { useSentEmails } from '../hooks/useEmail'
import type { SentEmail } from '../types/email'
import { emailHttp } from '../http/email'
import { handleApiError } from '../utils/handleApiError'
import { formatDate } from '../utils/formatters'
import { Header } from '../components/layout/Header'
import { Table, type Column } from '../components/ui/Table'
import { Pagination } from '../components/ui/Pagination'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'

const PER_PAGE = 10

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
  return oneLine.length > 100 ? `${oneLine.slice(0, 100)}…` : oneLine
}

function recipientEmailsForResend(row: SentEmail): string[] {
  if (row.recipients?.length) return row.recipients.map((e) => e.trim()).filter(Boolean)
  const t = row.to
  if (Array.isArray(t)) return t.map((e) => String(e).trim()).filter(Boolean)
  if (typeof t === 'string' && t.trim()) {
    return t
      .split(/[,;]/)
      .map((e) => e.trim())
      .filter(Boolean)
  }
  return []
}

export function EmailSentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const { data, isPending, isFetching } = useSentEmails(page, PER_PAGE)
  const items = data?.items ?? []
  const meta = data?.meta

  const resendMutation = useMutation({
    mutationFn: async (row: SentEmail) => {
      const to = recipientEmailsForResend(row)
      await emailHttp.send({
        subject: (row.subject ?? '').trim() || '(sem assunto)',
        body: (row.body ?? row.body_preview ?? '').trim(),
        to,
        client_ids: [],
        document_ids: [],
        attachments: [],
      })
    },
    onSuccess: () => {
      toast('success', 'E-mail reenviado com sucesso.')
      void queryClient.invalidateQueries({ queryKey: ['email', 'sent'] })
    },
    onError: (err) => {
      toast('error', handleApiError(err))
    },
  })

  const columns: Column<SentEmail>[] = [
    {
      key: 'subject',
      header: 'Assunto',
      render: (row) => (
        <span className="block truncate font-medium text-gray-900" title={row.subject ?? ''}>
          {row.subject ?? '—'}
        </span>
      ),
    },
    {
      key: 'to',
      header: 'Destinatários',
      render: (row) => (
        <span
          className="block truncate text-sm text-gray-700"
          title={formatRecipients(row)}
        >
          {formatRecipients(row)}
        </span>
      ),
    },
    {
      key: 'body',
      header: 'Prévia',
      render: (row) => (
        <span className="block truncate text-xs text-gray-500" title={previewBody(row)}>
          {previewBody(row)}
        </span>
      ),
    },
    {
      key: 'sent_at',
      header: 'Enviado em',
      render: (row) => {
        const d = row.sent_at ?? row.created_at
        return (
          <span className="block whitespace-nowrap text-sm text-gray-700">
            {d ? formatDate(d) : '—'}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: <span className="inline-block w-full text-center">Ações</span>,
      render: (row) => {
        const resending = resendMutation.isPending && resendMutation.variables?.id === row.id
        return (
          <div className="flex flex-wrap items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/email/sent/${row.id}`)}
              title="Visualizar"
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Enviar novamente"
              isLoading={resending}
              disabled={resendMutation.isPending}
              onClick={() => {
                if (recipientEmailsForResend(row).length === 0) {
                  toast('error', 'Este registro não possui destinatários para reenvio.')
                  return
                }
                resendMutation.mutate(row)
              }}
            >
              <RotateCw size={16} />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden">
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
        layoutFixed
      />

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  )
}
