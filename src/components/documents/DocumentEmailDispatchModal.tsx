import { useMemo, useState, useEffect } from 'react'
import { Mail } from 'lucide-react'
import type { Document } from '../../types/document'
import type { Client } from '../../types/client'
import type { EmailDispatchItem } from '../../types/email'
import { formatCpfCnpj } from '../../utils/formatters'
import { emailHttp } from '../../http/email'
import { handleApiError } from '../../utils/handleApiError'
import { useToast } from '../ui/Toast'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface DocumentEmailDispatchModalProps {
  isOpen: boolean
  onClose: () => void
  /** Chamado após envio bem-sucedido (ex.: limpar seleção na listagem). */
  onSuccess?: () => void
  selectedDocuments: Document[]
  clients: Client[]
}

function groupDocumentsByClient(docs: Document[]): Map<number, Document[]> {
  const map = new Map<number, Document[]>()
  for (const d of docs) {
    const list = map.get(d.client_id) ?? []
    list.push(d)
    map.set(d.client_id, list)
  }
  return map
}

export function DocumentEmailDispatchModal({
  isOpen,
  onClose,
  onSuccess,
  selectedDocuments,
  clients,
}: DocumentEmailDispatchModalProps) {
  const { toast } = useToast()
  const [isSending, setIsSending] = useState(false)
  /** Por cliente: IDs de ClientEmail marcados; vazio = não restringir (omitir email_ids). */
  const [restrictedEmailIds, setRestrictedEmailIds] = useState<Record<number, number[]>>({})

  const clientById = useMemo(() => {
    const m = new Map<number, Client>()
    clients.forEach((c) => m.set(c.id, c))
    return m
  }, [clients])

  const grouped = useMemo(
    () => groupDocumentsByClient(selectedDocuments),
    [selectedDocuments],
  )

  useEffect(() => {
    if (isOpen) {
      setRestrictedEmailIds({})
    }
  }, [isOpen, selectedDocuments])

  const clientEntries = useMemo(() => Array.from(grouped.entries()), [grouped])

  function toggleEmailForClient(clientId: number, emailId: number) {
    setRestrictedEmailIds((prev) => {
      const current = prev[clientId] ?? []
      const has = current.includes(emailId)
      const next = has ? current.filter((id) => id !== emailId) : [...current, emailId]
      return { ...prev, [clientId]: next }
    })
  }

  async function handleSubmit() {
    const dispatches: EmailDispatchItem[] = []
    for (const [clientId, docs] of clientEntries) {
      const document_ids = docs.map((d) => d.id)
      const item: EmailDispatchItem = { client_id: clientId, document_ids }
      const restricted = restrictedEmailIds[clientId]
      if (restricted && restricted.length > 0) {
        item.email_ids = restricted
      }
      dispatches.push(item)
    }

    if (dispatches.length === 0) {
      toast('info', 'Nenhum documento para enviar.')
      return
    }

    setIsSending(true)
    try {
      await emailHttp.dispatchBatch({ dispatches })
      toast('success', 'Envio de e-mails agendado com sucesso.')
      onSuccess?.()
      onClose()
    } catch (err) {
      toast('error', handleApiError(err))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enviar documentos por e-mail">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Será disparado um envio por cliente com os documentos selecionados. Por padrão, todos os
          destinatários do cliente recebem o e-mail.
        </p>

        <div className="max-h-72 space-y-4 overflow-y-auto">
          {clientEntries.map(([clientId, docs]) => {
            const client = clientById.get(clientId)
            const extraEmails = client?.emails ?? []
            const picked = restrictedEmailIds[clientId] ?? []

            return (
              <div key={clientId} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-900">
                  {client?.name ?? `Cliente #${clientId}`}
                </p>
                <p className="text-xs text-gray-500">{client ? formatCpfCnpj(client.cnpj) : ''}</p>
                <ul className="mt-2 list-inside list-disc text-xs text-gray-700">
                  {docs.map((d) => (
                    <li key={d.id}>
                      {d.type} (doc. #{d.id})
                    </li>
                  ))}
                </ul>

                {extraEmails.length > 0 && (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <p className="text-xs font-medium text-gray-700">
                      Enviar apenas para e-mails específicos (opcional)
                    </p>
                    <p className="mb-2 text-xs text-gray-500">
                      Útil para reenviar a um contato. Se ninguém estiver marcado, o envio segue o
                      padrão do cliente (todos os destinatários).
                    </p>
                    <div className="space-y-1.5">
                      {extraEmails.map((e) => (
                        <label
                          key={e.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={picked.includes(e.id)}
                            onChange={() => toggleEmailForClient(clientId, e.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-xs text-gray-800">{e.email}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} isLoading={isSending}>
            <Mail size={16} />
            Disparar envio
          </Button>
        </div>
      </div>
    </Modal>
  )
}
