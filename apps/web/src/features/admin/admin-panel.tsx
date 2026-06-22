import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

interface AdminPanelProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
}

export function AdminPanel({ title, subtitle, actions, toolbar, children }: AdminPanelProps) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>

      <Card padding="none" className="overflow-hidden">
        {toolbar && <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">{toolbar}</div>}
        {children}
      </Card>
    </section>
  )
}
