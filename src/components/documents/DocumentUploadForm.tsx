import { useState, useRef, type DragEvent } from 'react'
import { Upload } from 'lucide-react'
import { DOCUMENT_FILE_ACCEPT } from '../../constants/documents'
import { Button } from '../ui/Button'

function isAllowedDocumentFile(file: File): boolean {
  if (file.type === 'application/pdf') return true
  return file.type.startsWith('image/')
}

interface DocumentUploadFormProps {
  isLoading: boolean
  onUpload: (file: File) => void
}

export function DocumentUploadForm({ isLoading, onUpload }: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && isAllowedDocumentFile(dropped)) {
      setFile(dropped)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected && isAllowedDocumentFile(selected)) setFile(selected)
  }

  function handleSubmit() {
    if (file) onUpload(file)
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8
          transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}
        `}
      >
        <Upload size={32} className="text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 text-center px-2">
          {file
            ? file.name
            : 'CR, AATIPP ou boleto (PDF ou imagem) — arraste ou clique'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={DOCUMENT_FILE_ACCEPT}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <Button
        onClick={handleSubmit}
        isLoading={isLoading}
        disabled={!file}
        className="w-full"
      >
        Enviar Documento
      </Button>
    </div>
  )
}
