import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  fallback: string
  size?: number
  circle?: boolean
  className?: string
}

export function Avatar({ src, fallback, size = 48, circle, className }: AvatarProps) {
  const style = { width: size, height: size, borderRadius: circle ? 9999 : Math.round(size * 0.28) }
  if (src) return <img src={src} alt={fallback} style={style} className={cn('shrink-0 object-cover', className)} />
  return (
    <div
      style={style}
      className={cn('flex shrink-0 items-center justify-center bg-surface-muted font-semibold text-muted-foreground', size >= 56 ? 'text-lg' : 'text-sm', className)}
    >
      {fallback}
    </div>
  )
}
