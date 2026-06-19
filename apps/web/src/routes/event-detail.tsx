import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OrganizerLogo, StatusBadge, Tag } from '@/features/event/event-bits'
import { formatDateTime, policyLabel, visibilityLabel } from '@/features/event/event-meta'
import { useEvent, useLeaveEvent, useRegisterEvent } from '@/features/event/event.hooks'
import { resolveEventError } from '@/features/event/event.errors'
import { m } from '@/i18n/paraglide/messages'
import type { EventDetailView, ParticipantView } from '@/features/event/event.types'

export function EventDetailPage() {
  const { eventId = '' } = useParams()
  const { data: event, isLoading, error } = useEvent(eventId)

  if (isLoading) return <Centered>{m.event_loading()}</Centered>
  if (error || !event) return <Centered>{m.event_error_not_found()}</Centered>

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Header event={event} />
      <Participants participants={event.participants} />
    </div>
  )
}

function Header({ event }: { event: EventDetailView }) {
  const register = useRegisterEvent()
  const leave = useLeaveEvent()

  const onRegister = () =>
    register.mutate(event.id, {
      onSuccess: updated => toast.success(updated.myStatus === 'PENDING' ? m.event_register_pending() : m.event_registered()),
      onError: err => toast.error(resolveEventError(err)),
    })
  const onLeave = () => leave.mutate(event.id, { onSuccess: () => toast.success(m.event_left()), onError: err => toast.error(resolveEventError(err)) })

  const joined = event.myStatus === 'CONFIRMED' || event.myStatus === 'PENDING'
  const action = joined ? (
    <Button size="sm" variant="ghost" onClick={onLeave} loading={leave.isPending}>
      {m.event_leave()}
    </Button>
  ) : event.registrationPolicy === 'OPEN' ? (
    <Button size="sm" onClick={onRegister} loading={register.isPending}>
      {m.event_register()}
    </Button>
  ) : (
    <span className="text-xs text-muted-foreground">{event.registrationPolicy === 'INVITE_ONLY' ? m.event_join_invite_only() : m.event_join_closed()}</span>
  )

  return (
    <div className="mb-8">
      <div className="flex items-start gap-4">
        <OrganizerLogo url={event.organizer.logoUrl} name={event.organizer.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
          <p className="text-sm text-muted-foreground">
            {event.organizer.name} · {event.game.name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Tag>{visibilityLabel[event.visibility]()}</Tag>
            <Tag>{policyLabel[event.registrationPolicy]()}</Tag>
            {event.myStatus && <StatusBadge status={event.myStatus} />}
          </div>
        </div>
        <div className="shrink-0">{action}</div>
      </div>

      {event.description && <p className="mt-4 text-sm leading-relaxed text-foreground">{event.description}</p>}

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <Meta label={m.event_starts()} value={formatDateTime(event.startsAt)} />
        {event.endsAt && <Meta label={m.event_ends()} value={formatDateTime(event.endsAt)} />}
        {event.location && <Meta label={m.event_location()} value={event.location} />}
      </div>
    </div>
  )
}

function Participants({ participants }: { participants: ParticipantView[] }) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-foreground">{m.event_participants_title()}</h2>
      {participants.length === 0 && <p className="text-sm text-muted-foreground">{m.event_participants_empty()}</p>}
      <div className="divide-y divide-border">
        {participants.map(p => (
          <div key={p.id} className="flex items-center justify-between py-2.5">
            <span className="text-sm text-foreground">
              {p.displayName}
              <span className="text-muted-foreground">#{p.discriminator}</span>
            </span>
            <StatusBadge status={p.status} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-foreground">{value}</div>
    </div>
  )
}

function Centered({ children }: { children: string }) {
  return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">{children}</div>
}
