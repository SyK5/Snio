import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

interface SectionCardProps {
  title: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, children, className }: SectionCardProps) {
  return (
    <Card className={className}>
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      <div className="divide-y divide-border">{children}</div>
    </Card>
  )
}
