import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSentEmail } from '../hooks/useEmail'
import type { SentEmail } from '../types/email'
import { formatDate } from '../utils/formatters'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'

function formatRecipients(row: SentEmail): string {
  if (row.recipients?.length) return row.recipients.join(', ')
  const t = row.to
  if (Array.isArray(t)) return t.join(', ')
  if (typeof t === 'string' && t) return t
  return '—'
}

export function EmailSentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const numericId = Number(id)
  const { data: email, isLoading, isError } = useSentEmail(numericId)

  if (!id || !Number.isFinite(numericId) || numericId <= 0) {
    return (
      <div>
        <p className="text-sm text-gray-600">Identificador inválido.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/email/sent')}>
          Voltar à listagem
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !email) {
    return (
      <div>
        <p className="text-sm text-red-600">Não foi possível carregar este e-mail.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/email/sent')}>
          Voltar à listagem
        </Button>
      </div>
    )
  }

  const sentAt = email.sent_at ?? email.created_at

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/email/sent')}>
          <ArrowLeft size={16} />
          Histórico de e-mails
        </Button>
      </div>

      <Header
        title={email.subject ?? 'E-mail enviado'}
        subtitle={sentAt ? `Enviado em ${formatDate(sentAt)}` : undefined}
      />

      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Destinatários</p>
          <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{formatRecipients(email)}</p>
        </div>

        {(email.body_preview || email.body) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mensagem</p>
            <div className="mt-2 max-h-[480px] overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
              {email.body ?? email.body_preview ?? ''}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
