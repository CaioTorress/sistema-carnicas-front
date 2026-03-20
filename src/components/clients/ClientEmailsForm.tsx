import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { ClientEmail } from '../../types/client'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface ClientEmailsFormProps {
  emails: ClientEmail[]
  isAdding: boolean
  isRemoving: boolean
  onAdd: (email: string) => void
  onRemove: (emailId: number) => void
}

export function ClientEmailsForm({ emails, isAdding, isRemoving, onAdd, onRemove }: ClientEmailsFormProps) {
  const [email, setEmail] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (email.trim()) {
      onAdd(email.trim())
      setEmail('')
    }
  }

  return (
    <div className="space-y-5">
      {emails.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">E-mails cadastrados</p>
          <div className="space-y-2">
            {emails.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <span className="text-sm text-gray-700">{e.email}</span>
                <button
                  onClick={() => onRemove(e.id)}
                  disabled={isRemoving}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {emails.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-2">Nenhum e-mail adicional cadastrado.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-200 pt-4">
        <Input
          label="Novo e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="novo@email.com"
          required
        />
        <Button type="submit" isLoading={isAdding} className="w-full">
          Adicionar E-mail
        </Button>
      </form>
    </div>
  )
}
