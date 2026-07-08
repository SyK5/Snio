import { cn } from '@/lib/utils'
import { kindLabel, statusLabel } from './event-meta'
import type { OrganizerKind, ParticipationStatus } from './event.types'

export function OrganizerLogo({ url, name, size = 'md' }: { url: string | null; name: string; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-16 w-16 rounded-2xl text-lg' : 'h-12 w-12 rounded-xl text-sm'
  if (url) return <img src={url} alt={name} className={cn('shrink-0 object-cover', dim)} />
  return <div className={cn('flex shrink-0 items-center justify-center bg-surface-muted font-bold text-muted-foreground', dim)}>{name.slice(0, 2).toUpperCase()}</div>
}

export function StatusBadge({ status }: { status: ParticipationStatus }) {
  const tone = status === 'CONFIRMED' ? 'bg-primary/15 text-primary' : status === 'PENDING' ? 'bg-surface-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
  return <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', tone)}>{statusLabel[status]()}</span>
}

export function KindBadge({ kind }: { kind: OrganizerKind }) {
  const tone = kind === 'SYSTEM' ? 'bg-highlight/15 text-highlight' : kind === 'ORGANIZATION' ? 'bg-accent text-accent-foreground' : 'bg-surface-muted text-muted-foreground'
  return <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', tone)}>{kindLabel[kind]()}</span>
}

export function Tag({ children }: { children: string }) {
  return <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{children}</span>
}
