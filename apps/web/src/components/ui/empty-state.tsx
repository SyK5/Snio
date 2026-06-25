import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

export function EmptyState({ action, children }: { action?: ReactNode; children: ReactNode }) {
  return (
    <Card tone="muted" className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
      {children}
      {action}
    </Card>
  )
}
