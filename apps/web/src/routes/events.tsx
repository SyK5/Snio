import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{m.events_title()}</h1>

      {isLoading && <LoadingGrid />}

      {!isLoading && events?.length === 0 && !hasPrev && (
        <Card tone="muted" className="py-10 text-center text-sm text-muted-foreground">
          {m.events_empty()}
        </Card>
      )}

      <div className="grid gap-3">{!isLoading && events?.map(event => <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />)}</div>

      {(hasPrev || hasNext) && (
        <div className="mt-6 flex items-center justify-end gap-1">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            ‹
          </button>
          <span className="min-w-[2rem] text-center text-xs font-semibold text-highlight tabular-nums">{page}</span>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}

function EventCard({ event, onClick }: { event: EventView; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group w-full text-left">
      <Card className="flex cursor-pointer items-center gap-4 transition light:shadow-sm hover:border-highlight/60 hover:shadow-[0_0_0_1px_var(--highlight)] active:scale-[0.99]">
        <OrganizerLogo url={event.organizer.logoUrl} name={event.organizer.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-foreground">{event.title}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{event.organizer.name}</span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-highlight" />
            <span className="truncate">{event.game.name}</span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-highlight" />
            <span className="shrink-0">{formatDateTime(event.startsAt)}</span>
          </div>
        </div>
        {event.myStatus && <StatusBadge status={event.myStatus} />}
      </Card>
    </button>
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="flex items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          </div>
        </Card>
      ))}
    </div>
  )
}
