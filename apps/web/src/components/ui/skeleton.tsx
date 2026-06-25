import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted', className)} />
}

export function SkeletonCard() {
  return (
    <Card className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </Card>
  )
}
