import type { ReactNode } from 'react'
import { Spinner } from './Spinner'

export interface Column<T> {
  key: keyof T | string
  header: ReactNode
  render?: (row: T) => ReactNode
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  emptyMessage?: string
  /** Evita scroll horizontal: table-layout fixed + células com min-w-0 (útil em telas estreitas). */
  layoutFixed?: boolean
}

export function Table<T extends { id: number | string }>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  layoutFixed = false,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  const wrapClass = layoutFixed
    ? 'overflow-hidden rounded-lg border border-gray-200'
    : 'overflow-x-auto rounded-lg border border-gray-200'
  const tableClass = layoutFixed ? 'w-full table-fixed text-sm' : 'w-full text-sm'
  const thClass = layoutFixed
    ? 'px-3 py-3 text-left font-medium text-gray-600 min-w-0'
    : 'px-4 py-3 text-left font-medium text-gray-600'
  const tdClass = layoutFixed
    ? 'px-3 py-3 text-gray-700 min-w-0 align-top'
    : 'px-4 py-3 text-gray-700'

  return (
    <div className={wrapClass}>
      <table className={tableClass}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={thClass}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td key={String(col.key)} className={tdClass}>
                  {col.render
                    ? col.render(row)
                    : String(row[col.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
