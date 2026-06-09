import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cva, type VariantProps } from 'class-variance-authority'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { useModalShell } from '@/hooks/use-modal-shell'
import { cn } from '@/lib/utils'

const overlayVariants = cva('fixed inset-0 z-50 flex bg-black/60', {
  variants: {
    variant: {
      center: 'items-center justify-center p-4',
      drawer: 'items-stretch justify-end',
    },
  },
  defaultVariants: { variant: 'center' },
})

const panelVariants = cva('relative flex w-full flex-col overflow-hidden bg-surface text-foreground shadow-2xl', {
  variants: {
    variant: {
      center: 'max-h-[85vh] rounded-2xl border border-border',
      drawer: 'h-full max-w-md border-l border-border',
    },
  },
  defaultVariants: { variant: 'center' },
})

const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }

interface ModalProps extends VariantProps<typeof panelVariants> {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: IconDefinition
  footer?: ReactNode
  bodyClassName?: string
  size?: keyof typeof sizeMap
  paused?: boolean
  children: ReactNode
}

export function Modal({ open, onClose, title, subtitle, icon, footer, bodyClassName, size, children, variant, paused }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useModalShell(panelRef, open, onClose, paused)

  if (!open) return null

  return createPortal(
    <div className={overlayVariants({ variant })}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cn(panelVariants({ variant }), variant !== 'drawer' && sizeMap[size ?? 'md'], 'focus:outline-none')}>
        <div className="flex items-start gap-3 border-b border-border p-5">
          {icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-accent text-accent-foreground">
              <FontAwesomeIcon icon={icon} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="close" className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className={cn('flex-1 overflow-y-auto', bodyClassName ?? 'p-5')}>{children}</div>

        {footer && <div className="flex justify-end gap-2 border-t border-border p-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
