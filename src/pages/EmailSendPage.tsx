import { useMemo, useState, useRef, useCallback, type KeyboardEvent } from 'react'
import {
  Send, Paperclip, X, ChevronDown, ChevronRight,
  Users, FileText, File as FileIcon, Search, Plus,
} from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { useAllDocuments } from '../hooks/useDocuments'
import { emailHttp } from '../http/email'
import { handleApiError } from '../utils/handleApiError'
import { formatCpfCnpj } from '../utils/formatters'
import { useToast } from '../components/ui/Toast'
import { Spinner } from '../components/ui/Spinner'

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function RecipientChip({ email, onRemove }: { email: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200">
      {email}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-blue-200 transition-colors"
      >
        <X size={12} />
      </button>
    </span>
  )
}

function CollapsiblePanel({
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string
  icon: React.ReactNode
  badge?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 transition-colors"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {icon}
        <span className="flex-1">{title}</span>
        {badge != null && badge > 0 && (
          <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {badge}
          </span>
        )}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

export function EmailSendPage() {
  const { data: clientsData, isLoading: clientsLoading } = useClients({ page: 1, perPage: 200 })
  const clients = clientsData?.items
  const { data: docsData, isPending: docsLoading } = useAllDocuments({ page: 1, perPage: 200 })
  const documents = docsData?.items ?? []
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toInputRef = useRef<HTMLInputElement>(null)

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [toEmails, setToEmails] = useState<string[]>([])
  const [toInput, setToInput] = useState('')
  const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set())
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<number>>(new Set())
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [docSearch, setDocSearch] = useState('')

  const clientById = useMemo(() => {
    const m = new Map<number, { name: string; cnpj: string | null }>()
    clients?.forEach((c) => m.set(c.id, { name: c.name, cnpj: c.cnpj }))
    return m
  }, [clients])

  const visibleClients = useMemo(() => {
    if (!clients) return []
    const q = clientSearch.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.cnpj ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, '')),
    )
  }, [clients, clientSearch])

  const filteredDocs = useMemo(() => {
    if (selectedClientIds.size === 0) return documents
    return documents.filter((d) => selectedClientIds.has(d.client_id))
  }, [documents, selectedClientIds])

  const visibleDocs = useMemo(() => {
    const q = docSearch.trim().toLowerCase()
    if (!q) return filteredDocs
    return filteredDocs.filter((d) => {
      const info = clientById.get(d.client_id)
      const name = info?.name.toLowerCase() ?? ''
      return d.type.toLowerCase().includes(q) || String(d.id).includes(q) || name.includes(q)
    })
  }, [filteredDocs, docSearch, clientById])

  const commitToEmail = useCallback(
    (raw: string) => {
      const email = raw.trim()
      if (!email) return
      if (!isValidEmail(email)) {
        toast('error', `E-mail inválido: ${email}`)
        return
      }
      if (toEmails.includes(email)) {
        toast('info', 'Já adicionado.')
        return
      }
      setToEmails((prev) => [...prev, email])
      setToInput('')
    },
    [toEmails, toast],
  )

  function handleToKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
      e.preventDefault()
      commitToEmail(toInput)
    }
    if (e.key === 'Backspace' && toInput === '' && toEmails.length > 0) {
      setToEmails((prev) => prev.slice(0, -1))
    }
  }

  function handleToBlur() {
    if (toInput.trim()) commitToEmail(toInput)
  }

  function removeEmail(email: string) {
    setToEmails((prev) => prev.filter((e) => e !== email))
  }

  function toggleClient(id: number) {
    setSelectedClientIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleDocument(id: number) {
    setSelectedDocumentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function onFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list?.length) return
    setAttachments((prev) => [...prev, ...Array.from(list)])
    e.target.value = ''
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    const to = toEmails
    const invalid = to.filter((email) => !isValidEmail(email))
    if (invalid.length > 0) {
      toast('error', `E-mail inválido: ${invalid[0]}`)
      return
    }
    if (!subject.trim()) {
      toast('error', 'Informe o assunto do e-mail.')
      return
    }

    setIsSending(true)
    try {
      await emailHttp.send({
        subject: subject.trim(),
        body: body.trim(),
        to,
        client_ids: Array.from(selectedClientIds),
        document_ids: Array.from(selectedDocumentIds),
        attachments,
      })
      toast('success', 'E-mail enviado com sucesso.')
      setSubject('')
      setBody('')
      setToEmails([])
      setToInput('')
      setSelectedClientIds(new Set())
      setSelectedDocumentIds(new Set())
      setAttachments([])
    } catch (err) {
      toast('error', handleApiError(err))
    } finally {
      setIsSending(false)
    }
  }

  if (clientsLoading && !clients) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  const totalAttachSize = attachments.reduce((acc, f) => acc + f.size, 0)

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
        <h1 className="text-lg font-bold text-gray-900">Nova mensagem</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            title="Anexar arquivos"
          >
            <Paperclip size={16} />
            <span className="hidden sm:inline">Anexar</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={onFilesPicked}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSending ? (
              <Spinner size="sm" />
            ) : (
              <Send size={16} />
            )}
            Enviar
          </button>
        </div>
      </div>

      {/* ── Body: compose + sidebar ── */}
      <div className="flex min-h-0 flex-1">
        {/* ── Compose area (left) ── */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-white">
          {/* Para */}
          <div className="flex items-start gap-0 border-b border-gray-100 px-5 py-2.5">
            <span className="mt-1.5 w-16 shrink-0 text-sm font-medium text-gray-500">Para</span>
            <div
              className="flex flex-1 flex-wrap items-center gap-1.5 cursor-text"
              onClick={() => toInputRef.current?.focus()}
            >
              {toEmails.map((email) => (
                <RecipientChip key={email} email={email} onRemove={() => removeEmail(email)} />
              ))}
              <input
                ref={toInputRef}
                type="text"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                onKeyDown={handleToKeyDown}
                onBlur={handleToBlur}
                placeholder={toEmails.length === 0 ? 'Adicionar destinatários...' : ''}
                className="min-w-[160px] flex-1 border-none py-1 text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Assunto */}
          <div className="flex items-center gap-0 border-b border-gray-100 px-5 py-2.5">
            <span className="w-16 shrink-0 text-sm font-medium text-gray-500">Assunto</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Adicionar assunto"
              className="flex-1 border-none py-1 text-sm font-medium outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Attachments bar */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-2">
              {attachments.map((f, i) => (
                <span
                  key={`${f.name}-${i}`}
                  className="group flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs"
                >
                  <FileIcon size={14} className="shrink-0 text-gray-400" />
                  <span className="max-w-[140px] truncate text-gray-700">{f.name}</span>
                  <span className="text-gray-400">{formatSize(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="rounded-full p-0.5 text-gray-400 opacity-0 hover:bg-gray-200 hover:text-gray-700 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <span className="text-[10px] text-gray-400">{formatSize(totalAttachSize)} total</span>
            </div>
          )}

          {/* Corpo */}
          <div className="flex-1 px-5 py-4">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva sua mensagem aqui..."
              className="h-full min-h-[300px] w-full resize-none border-none text-sm leading-relaxed outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* ── Sidebar (right) ── */}
        <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-gray-200 bg-gray-50/60 lg:flex xl:w-80">
          {/* Clientes */}
          <CollapsiblePanel
            title="Clientes"
            icon={<Users size={14} />}
            badge={selectedClientIds.size}
            defaultOpen
          >
            <div className="relative mb-2">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full rounded border border-gray-200 bg-white py-1.5 pl-7 pr-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            {!clients?.length ? (
              <p className="py-2 text-xs text-gray-500">Nenhum cliente.</p>
            ) : (
              <div className="max-h-44 space-y-0.5 overflow-y-auto">
                {visibleClients.map((c) => {
                  const checked = selectedClientIds.has(c.id)
                  return (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                        checked ? 'bg-blue-50' : 'hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleClient(c.id)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                      />
                      <span className="flex-1 truncate font-medium text-gray-800">{c.name}</span>
                      <span className="shrink-0 text-[10px] text-gray-400">
                        {formatCpfCnpj(c.cnpj)}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </CollapsiblePanel>

          {/* Documentos */}
          <CollapsiblePanel
            title="Documentos"
            icon={<FileText size={14} />}
            badge={selectedDocumentIds.size}
            defaultOpen
          >
            <div className="relative mb-2">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Buscar documento..."
                className="w-full rounded border border-gray-200 bg-white py-1.5 pl-7 pr-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            {docsLoading ? (
              <div className="flex justify-center py-3">
                <Spinner size="sm" />
              </div>
            ) : visibleDocs.length === 0 ? (
              <p className="py-2 text-xs text-gray-500">
                {selectedClientIds.size > 0
                  ? 'Nenhum documento para os clientes selecionados.'
                  : 'Nenhum documento encontrado.'}
              </p>
            ) : (
              <div className="max-h-52 space-y-0.5 overflow-y-auto">
                {visibleDocs.map((d) => {
                  const info = clientById.get(d.client_id)
                  const checked = selectedDocumentIds.has(d.id)
                  return (
                    <label
                      key={d.id}
                      className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                        checked ? 'bg-blue-50' : 'hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDocument(d.id)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                      />
                      <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
                        {d.type}
                      </span>
                      <span className="flex-1 truncate text-gray-700">
                        {info?.name ?? `#${d.client_id}`}
                      </span>
                      <span className="shrink-0 text-[10px] text-gray-400">#{d.id}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </CollapsiblePanel>

          {/* Anexos rápidos */}
          <CollapsiblePanel
            title="Anexos"
            icon={<Paperclip size={14} />}
            badge={attachments.length}
            defaultOpen={false}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Plus size={14} />
              Adicionar arquivo
            </button>
            {attachments.length > 0 && (
              <div className="space-y-1">
                {attachments.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="group flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-white"
                  >
                    <FileIcon size={12} className="shrink-0 text-gray-400" />
                    <span className="flex-1 truncate text-gray-700">{f.name}</span>
                    <span className="text-[10px] text-gray-400">{formatSize(f.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="rounded p-0.5 text-gray-400 opacity-0 hover:text-red-500 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <p className="px-2 text-[10px] text-gray-400">{formatSize(totalAttachSize)} total</p>
              </div>
            )}
          </CollapsiblePanel>
        </aside>
      </div>
    </div>
  )
}
