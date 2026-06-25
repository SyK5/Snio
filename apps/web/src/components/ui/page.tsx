import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const widths = { sm: 'max-w-lg', md: 'max-w-2xl', lg: 'max-w-3xl', xl: 'max-w-4xl' }

export function Page({ width = 'xl', className, children }: { width?: keyof typeof widths; className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto px-6 py-10', widths[width], className)}>{children}</div>
}

export function PageHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {action}
    </div>
  )
}
