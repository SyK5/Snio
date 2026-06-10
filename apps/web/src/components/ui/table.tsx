import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'

export interface TableColumn<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string
  headerClassName?: string
  cellClassName?: string
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
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' } as const

export function Table<T>({ columns, rows, rowKey, onRowClick, isRowActive, isLoading, skeletonRows = 5, empty }: TableProps<T>) {
  const interactive = !!onRowClick

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn('px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground', alignClass[col.align ?? 'left'], col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading && <SkeletonRows columns={columns.length} rows={skeletonRows} />}

          {!isLoading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
                {empty ?? m.table_empty()}
              </td>
            </tr>
          )}

          {!isLoading &&
            rows.map(row => (
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
