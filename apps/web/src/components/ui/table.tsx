import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSort, faSortUp, faSortDown, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'

export type SortDir = 'asc' | 'desc'

export interface TableColumn<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string
  headerClassName?: string
  cellClassName?: string
  sortAccessor?: (row: T) => string | number
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  isRowActive?: (row: T) => boolean
  isLoading?: boolean
  skeletonRows?: number
  empty?: ReactNode
  pageSize?: number
  defaultSort?: { key: string; dir: SortDir }
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' } as const

export function Table<T>({ columns, rows, rowKey, onRowClick, isRowActive, isLoading, skeletonRows = 5, empty, pageSize, defaultSort }: TableProps<T>) {
  const interactive = !!onRowClick
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(defaultSort ?? null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    const col = sort && columns.find(c => c.key === sort.key)
    if (!sort || !col?.sortAccessor) return rows
    const acc = col.sortAccessor
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => (acc(a) < acc(b) ? -factor : acc(a) > acc(b) ? factor : 0))
  }, [rows, sort, columns])

  const pageCount = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const safePage = Math.min(page, pageCount - 1)
  const visible = pageSize ? sorted.slice(safePage * pageSize, safePage * pageSize + pageSize) : sorted

  useEffect(() => setPage(0), [sort, rows.length])

  const toggleSort = (key: string) => setSort(prev => (prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map(col => {
                const active = sort?.key === col.key
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn('px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground', alignClass[col.align ?? 'left'], col.headerClassName)}
                  >
                    {col.sortAccessor ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex cursor-pointer items-center gap-1.5 uppercase transition hover:text-foreground"
                      >
                        {col.header}
                        <FontAwesomeIcon
                          icon={!active ? faSort : sort!.dir === 'asc' ? faSortUp : faSortDown}
                          className={cn('text-[10px]', active ? 'text-primary' : 'text-muted-foreground/50')}
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <SkeletonRows columns={columns.length} rows={skeletonRows} />}

            {!isLoading && sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {empty ?? m.table_empty()}
                </td>
              </tr>
            )}

            {!isLoading &&
              visible.map(row => (
                <tr
                  key={rowKey(row)}
                  tabIndex={interactive ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? e => {
                          if (e.key !== 'Enter' && e.key !== ' ') return
                          e.preventDefault()
                          onRowClick(row)
                        }
                      : undefined
                  }
                  className={cn('outline-none transition', interactive && 'cursor-pointer hover:bg-muted focus-visible:bg-muted', isRowActive?.(row) && 'bg-accent')}
                >
                  {columns.map(col => (
                    <td key={col.key} className={cn('px-4 py-3 text-foreground', alignClass[col.align ?? 'left'], col.cellClassName)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pageSize && !isLoading && sorted.length > 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            {safePage * pageSize + 1}&ndash;{Math.min(sorted.length, safePage * pageSize + pageSize)} / {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <PageButton icon={faChevronLeft} disabled={safePage === 0} onClick={() => setPage(safePage - 1)} />
            <span className="px-2 tabular-nums">
              {safePage + 1} / {pageCount}
            </span>
            <PageButton icon={faChevronRight} disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} />
          </div>
        </div>
      )}
    </div>
  )
}

function PageButton({ icon, disabled, onClick }: { icon: typeof faChevronLeft; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  )
}

function SkeletonRows({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
