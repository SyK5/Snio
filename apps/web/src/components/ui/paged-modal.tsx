import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { useModalShell } from '@/hooks/use-modal-shell'
import { cn } from '@/lib/utils'

export interface PagedModalPagination {
  page: number
  hasNext: boolean
  hasPrev: boolean
  onNext: () => void
  onPrev: () => void
}

export interface PagedModalTab {
  key: string
  label: string
  icon?: IconDefinition
}

interface PagedModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: IconDefinition
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  pagination?: PagedModalPagination
  filters?: ReactNode
  actions?: ReactNode
  tabs?: PagedModalTab[]
  activeTab?: string
  onTabChange?: (key: string) => void
  footer?: ReactNode
  bodyClassName?: string
  paused?: boolean
  children: ReactNode
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)]',
}

export function PagedModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  pagination,
  filters,
  actions,
  tabs,
  activeTab,
  onTabChange,
  footer,
  bodyClassName,
  paused,
  children,
}: PagedModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useModalShell(panelRef, open, onClose, paused)

  if (!open) return null

  const hasSubhead = !!(pagination || filters || (tabs && tabs.length > 0))

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex w-full flex-col overflow-hidden rounded-2xl border border-border modal-surface text-foreground shadow-2xl focus:outline-none',
          'max-h-[88vh]',
          sizeMap[size],
        )}
      >
        <Head titleId={titleId} title={title} subtitle={subtitle} icon={icon} actions={actions} onClose={onClose} />

        {hasSubhead && <Subhead filters={filters} pagination={pagination} tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />}

        <div className={cn('flex-1 overflow-y-auto', bodyClassName ?? 'p-5')}>{children}</div>

        {footer && <div className="flex items-center justify-end gap-2 border-t border-border p-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

function Head({
  titleId,
  title,
  subtitle,
  icon,
  actions,
  onClose,
}: {
  titleId: string
  title: string
  subtitle?: string
  icon?: IconDefinition
  actions?: ReactNode
  onClose: () => void
}) {
  return (
    <div className="flex shrink-0 items-start gap-3 border-b border-border px-6 py-5">
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-accent text-sm text-accent-foreground">
          <FontAwesomeIcon icon={icon} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="truncate text-lg font-semibold text-foreground">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {actions}
        <button
          type="button"
          onClick={onClose}
          aria-label="close"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  )
}

function Subhead({
  filters,
  pagination,
  tabs,
  activeTab,
  onTabChange,
}: {
  filters?: ReactNode
  pagination?: PagedModalPagination
  tabs?: PagedModalTab[]
  activeTab?: string
  onTabChange?: (key: string) => void
}) {
  const hasTabs = tabs && tabs.length > 0
  const hasFiltersOrPagination = !!(filters || pagination)

  return (
    <div className="shrink-0 border-b border-border">
      {hasTabs && (
        <div className="flex items-center gap-1 px-6 pt-2">
          {tabs!.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange?.(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-t-lg px-3 py-2.5 text-sm font-medium transition',
                'border-b-2 -mb-px',
                activeTab === tab.key ? 'border-highlight text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.icon && <FontAwesomeIcon icon={tab.icon} className="text-[0.7rem]" />}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {hasFiltersOrPagination && (
        <div className="flex items-center justify-between gap-3 px-6 py-3">
          <div className="flex flex-1 items-center gap-2">{filters}</div>
          {pagination && <Pagination {...pagination} />}
        </div>
      )}
    </div>
  )
}

function Pagination({ page, hasPrev, hasNext, onPrev, onNext }: PagedModalPagination) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
      </button>
      <span className="min-w-[2rem] text-center text-xs font-semibold text-highlight tabular-nums">{page}</span>
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
      </button>
    </div>
  )
}
