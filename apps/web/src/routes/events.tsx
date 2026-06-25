import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityCard } from '@/components/ui/entity-card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Pager } from '@/components/ui/pager'
import { Page, PageHeader } from '@/components/ui/page'
import { EmptyState } from '@/components/ui/empty-state'
import { OrganizerLogo, StatusBadge } from '@/features/event/event-bits'
import { formatDateTime } from '@/features/event/event-meta'
import { useEvents } from '@/features/event/event.hooks'
import { m } from '@/i18n/paraglide/messages'
import type { EventView } from '@/features/event/event.types'

export function EventsPage() {
  const [page, setPage] = useState(1)
  const [stack, setStack] = useState<(string | undefined)[]>([undefined])
  const cursor = stack[stack.length - 1]
  const { data, isLoading } = useEvents(cursor)
  const navigate = useNavigate()

  const goNext = () => {
    if (!data?.nextCursor) return
    setStack(s => [...s, data.nextCursor!])
    setPage(p => p + 1)
  }

  const goPrev = () => {
    if (stack.length <= 1) return
    setStack(s => s.slice(0, -1))
    setPage(p => p - 1)
  }

  const events = data?.items
  const hasPrev = stack.length > 1
  const hasNext = !!data?.nextCursor

  return (
    <Page>
      <PageHeader title={m.events_title()} />

      {isLoading && <LoadingGrid />}

      {!isLoading && events?.length === 0 && !hasPrev && <EmptyState>{m.events_empty()}</EmptyState>}

      <div className="grid gap-3">{!isLoading && events?.map(event => <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />)}</div>

      <Pager page={page} hasPrev={hasPrev} hasNext={hasNext} onPrev={goPrev} onNext={goNext} />
    </Page>
  )
}

function EventCard({ event, onClick }: { event: EventView; onClick: () => void }) {
  return (
    <EntityCard
      onClick={onClick}
      media={<OrganizerLogo url={event.organizer.logoUrl} name={event.organizer.name} />}
      title={event.title}
      subtitle={
        <span className="flex items-center gap-1.5">
          <span className="truncate">{event.organizer.name}</span>
          <span className="h-1 w-1 shrink-0 rounded-full bg-highlight" />
          <span className="truncate">{event.game.name}</span>
          <span className="h-1 w-1 shrink-0 rounded-full bg-highlight" />
          <span className="shrink-0">{formatDateTime(event.startsAt)}</span>
        </span>
      }
      trailing={event.myStatus && <StatusBadge status={event.myStatus} />}
    />
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
