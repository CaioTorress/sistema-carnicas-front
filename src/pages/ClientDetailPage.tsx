import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Mail, FileUp, FilePlus } from 'lucide-react'
import { useClient, useUpdateClient, useAddClientEmail, useRemoveClientEmail } from '../hooks/useClients'
import { useDocuments, useEmitirCr, useEmitirAatipp, useUploadDocument } from '../hooks/useDocuments'
import { useNfse, useCreateNfse, useDeleteNfse } from '../hooks/useNfse'
import type { ClientPayload } from '../types/client'
import type { NfsePayload } from '../types/nfse'
import type { Nfse } from '../types/nfse'
import { handleApiError } from '../utils/handleApiError'
import { formatCpfCnpj } from '../utils/formatters'
import type { ClientEmail } from '../types/client'
import { useToast } from '../components/ui/Toast'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { ClientForm } from '../components/clients/ClientForm'
import { ClientEmailsForm } from '../components/clients/ClientEmailsForm'
import { DocumentList } from '../components/documents/DocumentList'
import { DocumentUploadForm } from '../components/documents/DocumentUploadForm'
import { NfseList } from '../components/nfse/NfseList'
import { NfseForm } from '../components/nfse/NfseForm'
import { DOCUMENT_KINDS_SHORT_LABEL } from '../constants/documents'

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: client, isLoading: clientLoading } = useClient(clientId)
  const updateClient = useUpdateClient(clientId)
  const { data: documents, isLoading: docsLoading } = useDocuments(clientId)
  const emitirCr = useEmitirCr(clientId)
  const emitirAatipp = useEmitirAatipp(clientId)
  const uploadDocument = useUploadDocument(clientId)
  const { data: nfseData, isLoading: nfseLoading } = useNfse(clientId)
  const nfseList = nfseData?.items
  const createNfse = useCreateNfse(clientId)
  const deleteNfse = useDeleteNfse(clientId)
  const addEmail = useAddClientEmail(clientId)
  const removeEmail = useRemoveClientEmail(clientId)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isNfseOpen, setIsNfseOpen] = useState(false)
  const [deleteNfseTarget, setDeleteNfseTarget] = useState<Nfse | null>(null)

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="py-20 text-center text-gray-500">
        Cliente não encontrado.
      </div>
    )
  }

  async function handleUpdateClient(payload: ClientPayload) {
    try {
      await updateClient.mutateAsync(payload)
      toast('success', 'Cliente atualizado!')
      setIsEditOpen(false)
    } catch (err) {
      toast('error', handleApiError(err))
    }
  }

  async function handleAddEmail(email: string) {
    try {
      await addEmail.mutateAsync(email)
      toast('success', 'E-mail adicionado!')
    } catch (err) {
      toast('error', handleApiError(err))
    }
  }

  async function handleRemoveEmail(emailId: number) {
    try {
      await removeEmail.mutateAsync(emailId)
      toast('success', 'E-mail removido!')
    } catch (err) {
      toast('error', handleApiError(err))
    }
  }

  async function handleEmitirCr() {
    try {
      await emitirCr.mutateAsync()
      toast('info', 'Emissão de CR solicitada. O processo é assíncrono.')
    } catch (err) {
      toast('error', handleApiError(err))
    }
  }

  async function handleEmitirAatipp() {
    try {
      await emitirAatipp.mutateAsync()
      toast('info', 'Emissão de AATIPP solicitada. O processo é assíncrono.')
    } catch (err) {
      toast('error', handleApiError(err))
    }
  }

  async function handleUpload(file: File) {
    try {
      await uploadDocument.mutateAsync(file)
      toast('success', 'Documento enviado com sucesso!')
      setIsUploadOpen(false)
    } catch (err) {
      toast('error', handleApiError(err))
    }
  }

  async function handleCreateNfse(payload: NfsePayload) {
    try {
      await createNfse.mutateAsync(payload)
      toast('success', 'NFS-e criada com sucesso!')
      setIsNfseOpen(false)
    } catch (err) {
      toast('error', handleApiError(err))
    }
  }

  async function handleDeleteNfse() {
    if (!deleteNfseTarget) return
    try {
      await deleteNfse.mutateAsync(deleteNfseTarget.id)
      toast('success', 'NFS-e excluída!')
    } catch (err) {
      toast('error', handleApiError(err))
    }
    setDeleteNfseTarget(null)
  }

  return (
    <div>
      <Header
        title={client.name}
        subtitle={formatCpfCnpj(client.cnpj)}
        actions={
          <Button variant="ghost" onClick={() => navigate('/clients')}>
            <ArrowLeft size={16} />
            Voltar
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Seção 1 — Dados do Cliente */}
        <Card title="Dados do Cliente">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <InfoField label="Nome" value={client.name} />
            <InfoField label="Tax ID" value={formatCpfCnpj(client.tax_id)} />
            <InfoField label="CNPJ" value={formatCpfCnpj(client.cnpj)} />
            <InfoField label="E-mail Principal" value={client.email} />
            {client.emails?.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-medium text-gray-500 mb-1">E-mails Relacionados</p>
                <div className="flex flex-wrap gap-2">
                  {client.emails.map((e: ClientEmail) => (
                    <span
                      key={e.id}
                      className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {e.email}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <InfoField label="Inscrição Municipal" value={client.municipal_registration} />
            <InfoField label="Código IBGE" value={client.ibge_city_code} />
            <InfoField label="Município GissOnline" value={client.giss_municipality} />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
              <Pencil size={14} />
              Editar
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsEmailOpen(true)}>
              <Mail size={14} />
              Gerenciar E-mails
            </Button>
          </div>
        </Card>

        {/* Seção 2 — Documentos (inclui NFS-e enviada como arquivo) */}
        <Card title={`Documentos (${DOCUMENT_KINDS_SHORT_LABEL})`}>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" onClick={handleEmitirCr} isLoading={emitirCr.isPending}>
              <FilePlus size={14} />
              Emitir CR
            </Button>
            <Button size="sm" onClick={handleEmitirAatipp} isLoading={emitirAatipp.isPending}>
              <FilePlus size={14} />
              Emitir AATIPP
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsUploadOpen(true)}>
              <FileUp size={14} />
              Upload Manual
            </Button>
          </div>
          <DocumentList documents={documents ?? []} isLoading={docsLoading} />
        </Card>

        {/* Seção 3 — NFS-e */}
        <Card title="Notas Fiscais (NFS-e)">
          <div className="mb-4">
            <Button size="sm" onClick={() => setIsNfseOpen(true)}>
              <FilePlus size={14} />
              Nova NFS-e
            </Button>
          </div>
          <NfseList
            nfseList={nfseList ?? []}
            isLoading={nfseLoading}
            onDelete={setDeleteNfseTarget}
          />
        </Card>
      </div>

      {/* Modais */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Cliente">
        <ClientForm
          client={client}
          isLoading={updateClient.isPending}
          onSubmit={handleUpdateClient}
        />
      </Modal>

      <Modal isOpen={isEmailOpen} onClose={() => setIsEmailOpen(false)} title="Gerenciar E-mails">
        <ClientEmailsForm
          emails={client.emails ?? []}
          isAdding={addEmail.isPending}
          isRemoving={removeEmail.isPending}
          onAdd={handleAddEmail}
          onRemove={handleRemoveEmail}
        />
      </Modal>

      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload de Documento">
        <DocumentUploadForm isLoading={uploadDocument.isPending} onUpload={handleUpload} />
      </Modal>

      <Modal isOpen={isNfseOpen} onClose={() => setIsNfseOpen(false)} title="Nova NFS-e">
        <NfseForm isLoading={createNfse.isPending} onSubmit={handleCreateNfse} />
      </Modal>

      <Modal isOpen={!!deleteNfseTarget} onClose={() => setDeleteNfseTarget(null)} title="Confirmar Exclusão">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir a NFS-e <strong>RPS {deleteNfseTarget?.rps_number}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteNfseTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteNfse} isLoading={deleteNfse.isPending}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}
