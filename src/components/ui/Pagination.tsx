import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { PaginationMeta } from '../../http/api'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

function range(start: number, end: number): number[] {
  const arr: number[] = []
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
}

function buildPages(current: number, last: number): (number | '...')[] {
  if (last <= 7) return range(1, last)

  if (current <= 3) return [...range(1, 4), '...', last]
  if (current >= last - 2) return [1, '...', ...range(last - 3, last)]
  return [1, '...', current - 1, current, current + 1, '...', last]
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { current_page, last_page, total, per_page } = meta
  if (last_page <= 1) return null

  const pages = buildPages(current_page, last_page)
  const from = (current_page - 1) * per_page + 1
  const to = Math.min(current_page * per_page, total)

  return (
    <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-between">
      <p className="text-xs text-gray-500">
        Exibindo {from}–{to} de {total}
      </p>

      <div className="flex items-center gap-1">
        <NavButton
          disabled={current_page <= 1}
          onClick={() => onPageChange(1)}
          title="Primeira"
        >
          <ChevronsLeft size={16} />
        </NavButton>
        <NavButton
          disabled={current_page <= 1}
          onClick={() => onPageChange(current_page - 1)}
          title="Anterior"
        >
          <ChevronLeft size={16} />
        </NavButton>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="px-1 text-xs text-gray-400 select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md text-xs font-medium transition-colors ${
                p === current_page
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ),
        )}

        <NavButton
          disabled={current_page >= last_page}
          onClick={() => onPageChange(current_page + 1)}
          title="Próxima"
        >
          <ChevronRight size={16} />
        </NavButton>
        <NavButton
          disabled={current_page >= last_page}
          onClick={() => onPageChange(last_page)}
          title="Última"
        >
          <ChevronsRight size={16} />
        </NavButton>
      </div>
    </div>
  )
}

function NavButton({
  disabled,
  onClick,
  title,
  children,
}: {
  disabled: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}
