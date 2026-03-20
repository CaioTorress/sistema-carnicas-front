import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useNfse, useCreateNfse, useDeleteNfse } from '../hooks/useNfse'
import type { Nfse, NfsePayload } from '../types/nfse'
import { handleApiError } from '../utils/handleApiError'
import { useToast } from '../components/ui/Toast'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { NfseList } from '../components/nfse/NfseList'
import { NfseForm } from '../components/nfse/NfseForm'

export function NfsePage() {
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const { toast } = useToast()

  const { data: nfseList, isLoading } = useNfse(clientId)
  const createNfse = useCreateNfse(clientId)
  const deleteNfse = useDeleteNfse(clientId)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Nfse | null>(null)

  async function handleCreate(payload: NfsePayload) {
    try {
      await createNfse.mutateAsync(payload)
      toast('success', 'NFS-e criada com sucesso!')
      setIsFormOpen(false)
    } catch (err) {
      toast('error', handleApiError(err))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteNfse.mutateAsync(deleteTarget.id)
      toast('success', 'NFS-e excluída!')
    } catch (err) {
      toast('error', handleApiError(err))
    }
    setDeleteTarget(null)
  }

  return (
    <div>
      <Header
        title="Notas Fiscais (NFS-e)"
        actions={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus size={16} />
            Nova NFS-e
          </Button>
        }
      />

      <NfseList
        nfseList={nfseList ?? []}
        isLoading={isLoading}
        onDelete={setDeleteTarget}
      />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Nova NFS-e">
        <NfseForm isLoading={createNfse.isPending} onSubmit={handleCreate} />
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmar Exclusão">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir a NFS-e <strong>RPS {deleteTarget?.rps_number}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteNfse.isPending}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
