import { useEffect, useMemo, useState } from 'react'
import { Mail } from 'lucide-react'
import type { BulkUploadSuccessItem } from '../../types/document'
import { formatCpfCnpj } from '../../utils/formatters'
import { emailHttp } from '../../http/email'
import type { EmailDispatchItem } from '../../types/email'
import { handleApiError } from '../../utils/handleApiError'
import { useToast } from '../ui/Toast'
import { Button } from '../ui/Button'

interface BulkUploadEmailSectionProps {
  success: BulkUploadSuccessItem[]
}

function groupByClient(items: BulkUploadSuccessItem[]): Map<number, BulkUploadSuccessItem[]> {
  const map = new Map<number, BulkUploadSuccessItem[]>()
  for (const item of items) {
    const list = map.get(item.client_id) ?? []
    list.push(item)
    map.set(item.client_id, list)
  }
  return map
}

export function BulkUploadEmailSection({ success }: BulkUploadEmailSectionProps) {
  const { toast } = useToast()
  const [sendEmailForClient, setSendEmailForClient] = useState<Record<number, boolean>>({})
  const [includeDocument, setIncludeDocument] = useState<Record<number, boolean>>({})
  const [isSending, setIsSending] = useState(false)

  const grouped = useMemo(() => groupByClient(success), [success])

  useEffect(() => {
    const send: Record<number, boolean> = {}
    const inc: Record<number, boolean> = {}
    const seenClient = new Set<number>()
    for (const s of success) {
      inc[s.document_id] = true
      if (!seenClient.has(s.client_id)) {
        seenClient.add(s.client_id)
        send[s.client_id] = true
      }
    }
    setSendEmailForClient(send)
    setIncludeDocument(inc)
  }, [success])

  const clientEntries = useMemo(() => Array.from(grouped.entries()), [grouped])

  function toggleClient(clientId: number) {
    setSendEmailForClient((prev) => ({ ...prev, [clientId]: !prev[clientId] }))
  }

  function toggleDocument(documentId: number) {
    setIncludeDocument((prev) => ({ ...prev, [documentId]: !prev[documentId] }))
  }

  function selectAllDocsForClient(clientId: number, value: boolean) {
    const items = grouped.get(clientId) ?? []
    setIncludeDocument((prev) => {
      const next = { ...prev }
      for (const it of items) {
        next[it.document_id] = value
      }
      return next
    })
  }

  async function handleSendEmails() {
    const dispatches: EmailDispatchItem[] = []

    for (const [clientId, items] of clientEntries) {
      if (!sendEmailForClient[clientId]) continue
      const document_ids = items
        .filter((it) => includeDocument[it.document_id])
        .map((it) => it.document_id)
      if (document_ids.length === 0) continue
      dispatches.push({ client_id: clientId, document_ids })
    }

    if (dispatches.length === 0) {
      toast('info', 'Habilite pelo menos um cliente e marque documentos para enviar.')
      return
    }

    setIsSending(true)
    try {
      await emailHttp.dispatchBatch({ dispatches })
      toast('success', `Envio agendado para ${dispatches.length} cliente(s).`)
    } catch (err) {
      toast('error', handleApiError(err))
    } finally {
      setIsSending(false)
    }
  }

  const canSend = clientEntries.some(([clientId, items]) => {
    if (!sendEmailForClient[clientId]) return false
    return items.some((it) => includeDocument[it.document_id])
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <Mail size={18} className="text-blue-600" />
        <p className="text-sm font-semibold text-gray-900">Enviar por e-mail ao cliente</p>
      </div>
      <p className="text-xs text-gray-500">
        Documentos agrupados por cliente. Marque se deseja enviar e quais arquivos incluir em cada e-mail.
      </p>

      <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
        {clientEntries.map(([clientId, items]) => {
          const first = items[0]
          const emailOn = sendEmailForClient[clientId] ?? false
          const selectedCount = items.filter((it) => includeDocument[it.document_id]).length

          return (
            <div
              key={clientId}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={emailOn}
                  onChange={() => toggleClient(clientId)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{first.client_name}</p>
                  <p className="text-xs text-gray-500">{formatCpfCnpj(first.cnpj)}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedCount} de {items.length} documento(s) no e-mail
                  </p>
                </div>
              </label>

              {emailOn && (
                <div className="mt-3 ml-6 space-y-2 border-l-2 border-blue-100 pl-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => selectAllDocsForClient(clientId, true)}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Marcar todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => selectAllDocsForClient(clientId, false)}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Desmarcar todos
                    </button>
                  </div>
                  {items.map((it) => (
                    <label
                      key={it.document_id}
                      className="flex cursor-pointer items-center gap-2 rounded border border-transparent bg-white px-2 py-1.5 hover:border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={includeDocument[it.document_id] ?? false}
                        onChange={() => toggleDocument(it.document_id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="min-w-0 flex-1 truncate text-xs text-gray-800">
                        <span className="font-medium">{it.document_type}</span>
                        {' — '}
                        {it.file}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Button
        onClick={handleSendEmails}
        disabled={!canSend}
        isLoading={isSending}
        className="w-full"
      >
        <Mail size={16} />
        Disparar e-mails selecionados
      </Button>
    </div>
  )
}
