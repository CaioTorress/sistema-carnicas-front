import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Download, Mail } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { useAllDocuments } from '../hooks/useDocuments'
import type { Document } from '../types/document'
import {
  formatCpfCnpj,
  formatDate,
  daysRemainingColor,
  resolveDaysUntilExpiry,
  formatDaysUntilExpiryLabel,
} from '../utils/formatters'
import { DOCUMENT_KINDS_LIST_LABEL, DOCUMENT_KINDS_SHORT_LABEL } from '../constants/documents'
import { Header } from '../components/layout/Header'
import { Table, type Column } from '../components/ui/Table'
import { DocumentStatusBadge } from '../components/documents/DocumentStatusBadge'
import { DocumentEmailDispatchModal } from '../components/documents/DocumentEmailDispatchModal'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'

export function DocumentsListPage() {
  const navigate = useNavigate()
  const { data: clients, isLoading: clientsLoading } = useClients()
  const clientIds = clients?.map((c) => c.id) ?? []
  const { documents, isPending: docsLoading } = useAllDocuments(clientIds)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  const clientById = useMemo(() => {
    const m = new Map<number, { name: string; cnpj: string }>()
    clients?.forEach((c) => {
      m.set(c.id, { name: c.name, cnpj: c.cnpj })
    })
    return m
  }, [clients])

  const filteredDocuments = useMemo(() => {
    let list = documents
    const q = search.trim().toLowerCase()
    if (q) {
      const digits = q.replace(/\D/g, '')
      list = documents.filter((doc) => {
        const info = clientById.get(doc.client_id)
        const name = info?.name.toLowerCase() ?? ''
        const cnpjDigits = info?.cnpj.replace(/\D/g, '') ?? ''
        return (
          doc.type.toLowerCase().includes(q) ||
          doc.status.toLowerCase().includes(q) ||
          name.includes(q) ||
          (digits.length > 0 && cnpjDigits.includes(digits))
        )
      })
    }
    return [...list].sort((a, b) => {
      if (!a.expires_at && !b.expires_at) return 0
      if (!a.expires_at) return 1
      if (!b.expires_at) return -1
      return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
    })
  }, [documents, search, clientById])

  const isLoading = clientsLoading || (clientIds.length > 0 && docsLoading)

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAllFiltered = useCallback(() => {
    const ids = filteredDocuments.map((d) => d.id)
    setSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id))
      if (allSelected) {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      }
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
  }, [filteredDocuments])

  const selectedDocuments = useMemo(
    () => documents.filter((d) => selectedIds.has(d.id)),
    [documents, selectedIds],
  )

  const allFilteredSelected =
    filteredDocuments.length > 0 &&
    filteredDocuments.every((d) => selectedIds.has(d.id))

  const columns: Column<Document>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allFilteredSelected}
          onChange={toggleSelectAllFiltered}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
          title="Selecionar todos visíveis"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row) => <span className="font-medium">{row.type}</span>,
    },
    {
      key: 'client_id',
      header: 'Cliente',
      render: (row) => {
        const info = clientById.get(row.client_id)
        return (
          <div>
            <p className="text-sm font-medium text-gray-900">{info?.name ?? '—'}</p>
            <p className="text-xs text-gray-500">{info ? formatCpfCnpj(info.cnpj) : ''}</p>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <DocumentStatusBadge status={row.status} />,
    },
    {
      key: 'issued_at',
      header: 'Emitido',
      render: (row) => (row.issued_at ? formatDate(row.issued_at) : '—'),
    },
    {
      key: 'expires_at',
      header: 'Vencimento',
      render: (row) => (row.expires_at ? formatDate(row.expires_at) : '—'),
    },
    {
      key: 'days_remaining',
      header: 'Dias até vencimento',
      render: (row) => {
        const days = resolveDaysUntilExpiry(row.expires_at, row.days_remaining)
        return (
          <span className={daysRemainingColor(days)}>{formatDaysUntilExpiryLabel(days)}</span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/clients/${row.client_id}`)}
            title="Ver cliente"
          >
            <Eye size={16} />
          </Button>
          {row.file_url && (
            <a href={row.file_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" title="Baixar PDF">
                <Download size={16} className="text-blue-600" />
              </Button>
            </a>
          )}
        </div>
      ),
    },
  ]

  if (clientsLoading && !clients) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <Header
        title={`Documentos — ${DOCUMENT_KINDS_SHORT_LABEL}`}
        subtitle={`${filteredDocuments.length} documento(s) — ${DOCUMENT_KINDS_LIST_LABEL}`}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative max-w-md flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, CNPJ, tipo ou status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {selectedIds.size > 0 && clients && (
          <Button onClick={() => setEmailModalOpen(true)}>
            <Mail size={16} />
            Enviar e-mails ({selectedIds.size})
          </Button>
        )}
      </div>

      {clientIds.length === 0 ? (
        <p className="py-12 text-center text-gray-500">Cadastre clientes para ver documentos.</p>
      ) : (
        <Table
          data={filteredDocuments}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="Nenhum documento encontrado."
        />
      )}

      {clients && (
        <DocumentEmailDispatchModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          onSuccess={() => setSelectedIds(new Set())}
          selectedDocuments={selectedDocuments}
          clients={clients}
        />
      )}
    </div>
  )
}
