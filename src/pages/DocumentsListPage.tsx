import { useMemo, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Eye, Download, Mail,
  ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { useAllDocuments } from '../hooks/useDocuments'
import type { SortOrder } from '../http/api'
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
import { Pagination } from '../components/ui/Pagination'
import { DocumentStatusBadge } from '../components/documents/DocumentStatusBadge'
import { DocumentEmailDispatchModal } from '../components/documents/DocumentEmailDispatchModal'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'

type DocSortColumn = 'type' | 'status' | 'issued_at' | 'expires_at'

function SortHeader({
  label,
  col,
  activeCol,
  activeOrder,
  onSort,
}: {
  label: string
  col: DocSortColumn
  activeCol?: DocSortColumn
  activeOrder?: SortOrder
  onSort: (col: DocSortColumn) => void
}) {
  let icon: ReactNode = <ArrowUpDown size={14} className="text-gray-400" />
  if (activeCol === col) {
    icon = activeOrder === 'asc'
      ? <ArrowUp size={14} className="text-blue-600" />
      : <ArrowDown size={14} className="text-blue-600" />
  }
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
    >
      {label}
      {icon}
    </button>
  )
}

export function DocumentsListPage() {
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterClientName, setFilterClientName] = useState('')
  const [orderBy, setOrderBy] = useState<DocSortColumn | undefined>(undefined)
  const [order, setOrder] = useState<SortOrder | undefined>(undefined)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const q = searchInput.trim()
      const docTypes = ['cr', 'aatipp', 'boleto', 'nfse']
      const lower = q.toLowerCase()
      if (docTypes.includes(lower)) {
        setFilterType(q)
        setFilterClientName('')
      } else {
        setFilterType('')
        setFilterClientName(q)
      }
      setPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  const { data: clientsData, isLoading: clientsLoading } = useClients({ page: 1, perPage: 200 })
  const clients = clientsData?.items

  const { data: docsData, isPending: docsLoading, isFetching } = useAllDocuments({
    page,
    type: filterType || undefined,
    clientName: filterClientName || undefined,
    order,
    orderBy,
  })
  const documents = docsData?.items ?? []
  const docsMeta = docsData?.meta

  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  const clientById = useMemo(() => {
    const m = new Map<number, { name: string; cnpj: string | null }>()
    clients?.forEach((c) => {
      m.set(c.id, { name: c.name, cnpj: c.cnpj })
    })
    return m
  }, [clients])

  const isLoading = clientsLoading || docsLoading

  const toggleSort = useCallback((col: DocSortColumn) => {
    if (orderBy === col) {
      if (order === 'asc') setOrder('desc')
      else if (order === 'desc') { setOrderBy(undefined); setOrder(undefined) }
      else setOrder('asc')
    } else {
      setOrderBy(col)
      setOrder('asc')
    }
    setPage(1)
  }, [orderBy, order])

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    const ids = documents.map((d) => d.id)
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
  }, [documents])

  const selectedDocuments = useMemo(
    () => documents.filter((d) => selectedIds.has(d.id)),
    [documents, selectedIds],
  )

  const allSelected =
    documents.length > 0 && documents.every((d) => selectedIds.has(d.id))

  const columns: Column<Document>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
          title="Selecionar todos da página"
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
      header: (
        <SortHeader label="Tipo" col="type" activeCol={orderBy} activeOrder={order} onSort={toggleSort} />
      ),
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
            <p className="text-xs text-gray-500">
              {formatCpfCnpj(info?.cnpj ?? row.cnpj)}
            </p>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: (
        <SortHeader label="Status" col="status" activeCol={orderBy} activeOrder={order} onSort={toggleSort} />
      ),
      render: (row) => <DocumentStatusBadge status={row.status} />,
    },
    {
      key: 'issued_at',
      header: (
        <SortHeader label="Emitido" col="issued_at" activeCol={orderBy} activeOrder={order} onSort={toggleSort} />
      ),
      render: (row) => (row.issued_at ? formatDate(row.issued_at) : '—'),
    },
    {
      key: 'expires_at',
      header: (
        <SortHeader label="Vencimento" col="expires_at" activeCol={orderBy} activeOrder={order} onSort={toggleSort} />
      ),
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
        subtitle={docsMeta ? `${docsMeta.total} documento(s) — ${DOCUMENT_KINDS_LIST_LABEL}` : DOCUMENT_KINDS_LIST_LABEL}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative max-w-md flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome do cliente ou tipo (CR, AATIPP, BOLETO, NFSE)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {isFetching && !isLoading && (
          <span className="text-xs text-gray-400 animate-pulse">Atualizando...</span>
        )}
        {selectedIds.size > 0 && clients && (
          <Button onClick={() => setEmailModalOpen(true)}>
            <Mail size={16} />
            Enviar e-mails ({selectedIds.size})
          </Button>
        )}
      </div>

      <Table
        data={documents}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Nenhum documento encontrado."
      />
      {docsMeta && <Pagination meta={docsMeta} onPageChange={setPage} />}

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
