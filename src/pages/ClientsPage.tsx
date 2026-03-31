import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Upload, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useImportClientsCsv } from '../hooks/useClients'
import type { SortOrder } from '../http/api'
import type { Client, ClientPayload } from '../types/client'
import { handleApiError } from '../utils/handleApiError'
import { useToast } from '../components/ui/Toast'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Pagination } from '../components/ui/Pagination'
import { ClientList } from '../components/clients/ClientList'
import { ClientForm } from '../components/clients/ClientForm'

type OrderByColumn = 'name' | 'cnpj' | 'email'

export function ClientsPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchCnpj, setSearchCnpj] = useState('')
  const [orderBy, setOrderBy] = useState<OrderByColumn | undefined>(undefined)
  const [order, setOrder] = useState<SortOrder | undefined>(undefined)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const q = searchInput.trim()
      const isDigits = /^\d+$/.test(q.replace(/\D/g, '')) && q.replace(/\D/g, '').length >= 3
      setSearchName(isDigits ? '' : q)
      setSearchCnpj(isDigits ? q.replace(/\D/g, '') : '')
      setPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  const { data, isLoading, isFetching } = useClients({
    page,
    name: searchName || undefined,
    cnpj: searchCnpj || undefined,
    order,
    orderBy,
  })
  const clients = data?.items ?? []
  const meta = data?.meta

  const createClient = useCreateClient()
  const deleteClient = useDeleteClient()
  const importCsv = useImportClientsCsv()
  const { toast } = useToast()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const csvRef = useRef<HTMLInputElement>(null)

  const updateClient = useUpdateClient(editingClient?.id ?? 0)

  const toggleSort = useCallback((col: OrderByColumn) => {
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

  function openCreate() {
    setEditingClient(undefined)
    setIsFormOpen(true)
  }

  function openEdit(client: Client) {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  async function handleFormSubmit(payload: ClientPayload) {
    try {
      if (editingClient) {
        await updateClient.mutateAsync(payload)
        toast('success', 'Cliente atualizado com sucesso!')
      } else {
        await createClient.mutateAsync(payload)
        toast('success', 'Cliente criado com sucesso!')
      }
      setIsFormOpen(false)
      setEditingClient(undefined)
    } catch (err) {
      toast('error', handleApiError(err))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteClient.mutateAsync(deleteTarget.id)
      toast('success', 'Cliente excluído com sucesso!')
    } catch (err) {
      toast('error', handleApiError(err))
    }
    setDeleteTarget(null)
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importCsv.mutateAsync(file)
      toast('success', 'Importação CSV realizada com sucesso!')
    } catch (err) {
      toast('error', handleApiError(err))
    }
    if (csvRef.current) csvRef.current.value = ''
  }

  function sortIcon(col: OrderByColumn) {
    if (orderBy !== col) return <ArrowUpDown size={14} className="text-gray-400" />
    if (order === 'asc') return <ArrowUp size={14} className="text-blue-600" />
    return <ArrowDown size={14} className="text-blue-600" />
  }

  return (
    <div>
      <Header
        title="Clientes"
        subtitle={meta ? `${meta.total} cliente(s)` : undefined}
        actions={
          <>
            <Button variant="secondary" onClick={() => csvRef.current?.click()} isLoading={importCsv.isPending}>
              <Upload size={16} />
              Importar CSV
            </Button>
            <input ref={csvRef} type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
            <Button onClick={openCreate}>
              <Plus size={16} />
              Novo Cliente
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {isFetching && !isLoading && (
          <span className="text-xs text-gray-400 animate-pulse">Atualizando...</span>
        )}
      </div>

      <ClientList
        clients={clients}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        sortIcon={sortIcon}
        onSort={toggleSort}
      />
      {meta && <Pagination meta={meta} onPageChange={setPage} />}

      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingClient(undefined) }}
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <ClientForm
          client={editingClient}
          isLoading={createClient.isPending || updateClient.isPending}
          onSubmit={handleFormSubmit}
        />
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir o cliente <strong>{deleteTarget?.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteClient.isPending}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
