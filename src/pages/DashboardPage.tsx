import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, FileText, AlertTriangle, Receipt, Upload,
  X, File as FileIcon, XCircle, AlertTriangle as WarnIcon,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useClients } from '../hooks/useClients'
import { useExpiringDocumentsCount } from '../hooks/useDocuments'
import { clientsHttp } from '../http/clients'
import { nfseHttp } from '../http/nfse'
import { documentsHttp } from '../http/documents'
import type { BulkUploadResult } from '../types/document'
import {
  DOCUMENT_KINDS_SHORT_LABEL,
  DOCUMENT_KINDS_LIST_LABEL,
  DOCUMENT_FILE_ACCEPT,
} from '../constants/documents'
import { handleApiError } from '../utils/handleApiError'
import { formatCpfCnpj } from '../utils/formatters'
import { useToast } from '../components/ui/Toast'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { BulkUploadEmailSection } from '../components/documents/BulkUploadEmailSection'

type ImportType = 'clients' | 'emails' | 'documents'

const importOptions: { value: ImportType; label: string; description: string; accept: string }[] = [
  {
    value: 'clients',
    label: 'Clientes',
    description: 'CSV com colunas obrigatórias: name, cnpj, email',
    accept: '.csv',
  },
  { value: 'emails', label: 'E-mails', description: 'Importar planilha(s) CSV de e-mails', accept: '.csv' },
  {
    value: 'documents',
    label: `Documentos (${DOCUMENT_KINDS_SHORT_LABEL})`,
    description:
      'Enviar PDF, imagem ou XML de NFS-e — o sistema identifica cliente e tipo (CR, AATIPP, boleto ou NFS-e)',
    accept: DOCUMENT_FILE_ACCEPT,
  },
]

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DashboardPage() {
  const queryClient = useQueryClient()
  const { data: clientsData, isLoading } = useClients()
  const clients = clientsData?.items
  const clientsMeta = clientsData?.meta
  const { count: expiringIn7Days, isPending: expiringDocsLoading } = useExpiringDocumentsCount(7)
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [importType, setImportType] = useState<ImportType>('clients')
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  const totalClients = clientsMeta?.total ?? clients?.length ?? 0
  const currentOption = importOptions.find((o) => o.value === importType)
  const canUpload = files.length > 0

  function openModal() {
    setImportType('clients')
    setFiles([])
    setBulkResult(null)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setFiles([])
    setBulkResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleTypeChange(value: ImportType) {
    setImportType(value)
    setFiles([])
    setBulkResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected || selected.length === 0) return
    const newFiles = Array.from(selected)
    setFiles((prev) => [...prev, ...newFiles])
    setBulkResult(null)
    e.target.value = ''
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setBulkResult(null)
  }

  async function handleUpload() {
    if (files.length === 0) return

    setIsUploading(true)
    setBulkResult(null)

    try {
      if (importType === 'documents') {
        const { data } = await documentsHttp.bulkUpload(files)
        const result = data.data
        setBulkResult(result)

        if (result.error_count === 0 && result.skipped_count === 0) {
          toast('success', `${result.success_count} documento(s) importado(s) com sucesso!`)
        } else if (result.success_count > 0) {
          toast('warning', `${result.success_count} sucesso, ${result.skipped_count} ignorado(s), ${result.error_count} erro(s)`)
        } else {
          toast('error', 'Nenhum documento foi importado.')
        }
        void queryClient.invalidateQueries({ queryKey: ['documents'] })
      } else {
        let successCount = 0
        let errorCount = 0

        for (const file of files) {
          try {
            if (importType === 'clients') {
              await clientsHttp.importCsv(file)
            } else {
              await nfseHttp.importEmailsCsv(file)
            }
            successCount++
          } catch (err) {
            errorCount++
            toast('error', `Erro em "${file.name}": ${handleApiError(err)}`)
          }
        }

        if (successCount > 0) {
          toast('success', `${successCount} arquivo(s) de ${currentOption?.label ?? ''} importado(s) com sucesso!`)
        }

        if (errorCount === 0) {
          closeModal()
        }
      }
    } catch (err) {
      toast('error', handleApiError(err))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Visão geral do sistema"
        actions={
          <Button onClick={openModal}>
            <Upload size={16} />
            Importar Arquivo
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          icon={<Users size={24} className="text-blue-600" />}
          label="Total de Clientes"
          value={totalClients}
          color="bg-blue-50"
        />
        <StatCard
          icon={<FileText size={24} className="text-green-600" />}
          label="Documentos Emitidos"
          value="—"
          color="bg-green-50"
        />
        <StatCard
          icon={<AlertTriangle size={24} className="text-yellow-600" />}
          label="Vencendo em 7 dias"
          value={expiringDocsLoading ? '…' : expiringIn7Days}
          color="bg-yellow-50"
        />
        <StatCard
          icon={<Receipt size={24} className="text-purple-600" />}
          label="NFS-e no Mês"
          value="—"
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <Card title="Atalhos Rápidos">
          <div className="space-y-3">
            <button
              onClick={() => navigate('/clients')}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <Users size={20} className="text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Gerenciar Clientes</p>
                <p className="text-xs text-gray-500">Cadastrar, editar ou visualizar clientes</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/documents')}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <FileText size={20} className="text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Documentos</p>
                <p className="text-xs text-gray-500">Listagem de {DOCUMENT_KINDS_LIST_LABEL} por cliente</p>
              </div>
            </button>
          </div>
        </Card>

        <Card title="Clientes Recentes">
          {clients && clients.length > 0 ? (
            <div className="space-y-2">
              {clients.slice(0, 5).map((client) => (
                <button
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-100 p-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatCpfCnpj(client.cnpj)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-500">Nenhum cliente cadastrado.</p>
          )}
        </Card>
      </div>

      {/* Modal de Importação */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Importar Arquivo">
        <div className="space-y-5">
          {/* Select tipo */}
          <div className="flex flex-col gap-1">
            <label htmlFor="import-type" className="text-sm font-medium text-gray-700">
              Tipo de importação
            </label>
            <select
              id="import-type"
              value={importType}
              onChange={(e) => handleTypeChange(e.target.value as ImportType)}
              disabled={isUploading}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              {importOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">{currentOption?.description}</p>
          </div>

          {/* Seletor de arquivos */}
          {!bulkResult && (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Arquivo(s){' '}
                  {importType === 'documents' ? 'PDF, imagem ou XML (NFS-e)' : 'CSV'}
                </span>
                <div
                  className={`relative flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Upload size={18} />
                  <span>Clique para selecionar arquivos</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={currentOption?.accept ?? '.csv'}
                    multiple
                    onChange={handleFilesSelected}
                    disabled={isUploading}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Lista de arquivos */}
              {files.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-700">
                    {files.length} arquivo(s) selecionado(s)
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileIcon size={16} className="shrink-0 text-gray-400" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-700">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          disabled={isUploading}
                          className="shrink-0 ml-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!canUpload}
                isLoading={isUploading}
                className="w-full"
              >
                <Upload size={16} />
                {files.length > 1
                  ? `Enviar ${files.length} Arquivos`
                  : 'Enviar Arquivo'}
              </Button>
            </>
          )}

          {/* Resultado do bulk upload */}
          {bulkResult && (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                  <p className="text-lg font-bold text-green-700">{bulkResult.success_count}</p>
                  <p className="text-xs text-green-600">Sucesso</p>
                </div>
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-center">
                  <p className="text-lg font-bold text-yellow-700">{bulkResult.skipped_count}</p>
                  <p className="text-xs text-yellow-600">Ignorados</p>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
                  <p className="text-lg font-bold text-red-700">{bulkResult.error_count}</p>
                  <p className="text-xs text-red-600">Erros</p>
                </div>
              </div>

              {/* Agrupado por cliente + opção de enviar e-mail */}
              {bulkResult.success.length > 0 && (
                <BulkUploadEmailSection success={bulkResult.success} />
              )}

              {/* Lista de ignorados */}
              {bulkResult.skipped.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Ignorados</p>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {bulkResult.skipped.map((item, i) => {
                      const reason = item.reason || item.error || item.message || 'Motivo não informado'
                      return (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">
                          <WarnIcon size={16} className="shrink-0 mt-0.5 text-yellow-600" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-yellow-800">{item.file}</p>
                            {item.cnpj && (
                              <p className="text-xs text-yellow-800/80">CNPJ: {formatCpfCnpj(item.cnpj)}</p>
                            )}
                            <p className="text-sm text-yellow-700">{reason}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Lista de erros */}
              {bulkResult.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Erros</p>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {bulkResult.errors.map((item, i) => {
                      const reason = item.error || item.reason || item.message || 'Erro desconhecido'
                      return (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                          <XCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-red-800">{item.file}</p>
                            {item.cnpj && (
                              <p className="text-xs text-red-800/80">CNPJ: {formatCpfCnpj(item.cnpj)}</p>
                            )}
                            <p className="text-sm text-red-700">{reason}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="secondary" onClick={closeModal} className="flex-1">
                  Fechar
                </Button>
                <Button
                  onClick={() => { setFiles([]); setBulkResult(null) }}
                  className="flex-1"
                >
                  Importar Mais
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
