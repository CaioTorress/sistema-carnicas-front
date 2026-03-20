import { useState, useMemo, useRef } from 'react'
import { Plus, Upload, Search } from 'lucide-react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useImportClientsCsv } from '../hooks/useClients'
import type { Client, ClientPayload } from '../types/client'
import { handleApiError } from '../utils/handleApiError'
import { useToast } from '../components/ui/Toast'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ClientList } from '../components/clients/ClientList'
import { ClientForm } from '../components/clients/ClientForm'

export function ClientsPage() {
  const { data: clients, isLoading } = useClients()
  const createClient = useCreateClient()
  const deleteClient = useDeleteClient()
  const importCsv = useImportClientsCsv()
  const { toast } = useToast()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [search, setSearch] = useState('')
  const csvRef = useRef<HTMLInputElement>(null)

  const updateClient = useUpdateClient(editingClient?.id ?? 0)

  const filteredClients = useMemo(() => {
    if (!clients) return []
    if (!search.trim()) return clients
    const query = search.toLowerCase()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.cnpj.includes(query.replace(/\D/g, '')),
    )
  }, [clients, search])

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

  return (
    <div>
      <Header
        title="Clientes"
        subtitle={`${filteredClients.length} cliente(s) encontrado(s)`}
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

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <ClientList
        clients={filteredClients}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

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
