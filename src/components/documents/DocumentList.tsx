import type { Document } from '../../types/document'
import { DocumentCard } from './DocumentCard'
import { Spinner } from '../ui/Spinner'

interface DocumentListProps {
  documents: Document[]
  isLoading: boolean
}

export function DocumentList({ documents, isLoading }: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500">
        Nenhum documento encontrado.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  )
}
