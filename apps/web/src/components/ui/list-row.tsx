import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ListRowProps {
  media?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  active?: boolean
  className?: string
  children: ReactNode
}

export function ListRow({ media, trailing, onClick, active, className, children }: ListRowProps) {
  const cls = cn('flex items-center gap-3 py-3 transition', onClick && 'w-full cursor-pointer text-left hover:bg-muted', active && 'bg-primary/5', className)
  const body = (
    <>
      {media}
      <div className="min-w-0 flex-1">{children}</div>
      {trailing}
    </>
  )
  if (!onClick) return <div className={cls}>{body}</div>
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  )
}
