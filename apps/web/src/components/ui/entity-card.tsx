import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ContextMenuEntry } from '@/components/ui/context-menu'

interface EntityCardProps {
  media?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  contextMenu?: ContextMenuEntry[]
  className?: string
}

export function EntityCard({ media, title, subtitle, trailing, onClick, contextMenu, className }: EntityCardProps) {
  const card = (
    <Card
      contextMenu={contextMenu}
      className={cn(
        'flex items-center gap-4 transition',
        onClick && 'cursor-pointer light:shadow-sm hover:border-highlight/60 hover:shadow-[0_0_0_1px_var(--highlight)] active:scale-[0.99]',
        className,
      )}
    >
      {media}
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground">{title}</div>
        {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {trailing}
    </Card>
  )

  if (!onClick) return card
  return (
    <button type="button" onClick={onClick} className="group w-full text-left">
      {card}
    </button>
  )
}
