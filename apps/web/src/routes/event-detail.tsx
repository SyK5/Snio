import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { Centered } from '@/components/ui/centered'
import { SectionCard } from '@/components/ui/section-card'
import { ListRow } from '@/components/ui/list-row'
import { Page } from '@/components/ui/page'
import { OrganizerLogo, StatusBadge, Tag, KindBadge } from '@/features/event/event-bits'
import { formatDateTime, policyLabel, visibilityLabel } from '@/features/event/event-meta'
import { useApproveParticipant, useCancelEvent, useEvent, useLeaveEvent, useRegisterEvent, useRejectParticipant } from '@/features/event/event.hooks'
import { resolveEventError } from '@/features/event/event.errors'
import { EventInviteManagerModal } from '@/features/event/event-invite-manager-modal'
import { EventFormModal } from '@/features/event/event-form-modal'
import { m } from '@/i18n/paraglide/messages'
import type { EventDetailView } from '@/features/event/event.types'

export function EventDetailPage() {
  const { eventId = '' } = useParams()
  const { data: event, isLoading, error } = useEvent(eventId)

  if (isLoading) return <Centered>{m.event_loading()}</Centered>
  if (error || !event) return <Centered>{m.event_error_not_found()}</Centered>

  return (
    <Page width="lg">
      <Header event={event} />
      <Participants event={event} />
    </Page>
  )
}

function Header({ event }: { event: EventDetailView }) {
  const clanId = event.organizer.id ?? ''
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const navigate = useNavigate()
  const register = useRegisterEvent()
  const leave = useLeaveEvent()
  const cancel = useCancelEvent(clanId)

  const onRegister = () =>
    register.mutate(event.id, {
      onSuccess: updated => toast.success(updated.myStatus === 'PENDING' ? m.event_register_pending() : m.event_registered()),
      onError: err => toast.error(resolveEventError(err)),
    })
  const onLeave = () => leave.mutate(event.id, { onSuccess: () => toast.success(m.event_left()), onError: err => toast.error(resolveEventError(err)) })
  const onCancel = () =>
    cancel.mutate(event.id, {
      onSuccess: () => {
        toast.success(m.event_cancelled())
        navigate('/events')
      },
      onError: err => toast.error(resolveEventError(err)),
    })

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
            <KindBadge kind={event.organizer.kind} />
            <Tag>{visibilityLabel[event.visibility]()}</Tag>
            <Tag>{policyLabel[event.registrationPolicy]()}</Tag>
            {event.myStatus && <StatusBadge status={event.myStatus} />}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {action}
          {event.canManage && (
            <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
              {m.event_edit()}
            </Button>
          )}
          {event.canInvite && (
            <Button size="sm" variant="ghost" onClick={() => setInviteOpen(true)}>
              {m.event_invites_manage()}
            </Button>
          )}
          {event.canManage && (
            <Button size="sm" variant="danger" onClick={onCancel} loading={cancel.isPending}>
              {m.event_manage_cancel()}
            </Button>
          )}
        </div>
      </div>

      {event.description && <p className="mt-4 text-sm leading-relaxed text-foreground">{event.description}</p>}

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <Meta label={m.event_starts()} value={formatDateTime(event.startsAt)} />
        {event.endsAt && <Meta label={m.event_ends()} value={formatDateTime(event.endsAt)} />}
        {event.location && <Meta label={m.event_location()} value={event.location} />}
      </div>

      <EventInviteManagerModal clanId={clanId} eventId={event.id} open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <EventFormModal open={editOpen} onClose={() => setEditOpen(false)} event={event} />
    </div>
  )
}

function Participants({ event }: { event: EventDetailView }) {
  const clanId = event.organizer.id ?? ''
  const approve = useApproveParticipant(clanId)
  const reject = useRejectParticipant(clanId)
  const participants = event.participants

  const onApprove = (userId: string) =>
    approve.mutate({ eventId: event.id, userId }, { onSuccess: () => toast.success(m.event_approved()), onError: err => toast.error(resolveEventError(err)) })
  const onReject = (userId: string) =>
    reject.mutate({ eventId: event.id, userId }, { onSuccess: () => toast.success(m.event_rejected()), onError: err => toast.error(resolveEventError(err)) })

  return (
    <SectionCard title={m.event_participants_title()}>
      {participants.length === 0 && <p className="text-sm text-muted-foreground">{m.event_participants_empty()}</p>}
      {participants.map(p => (
        <ListRow
          key={p.id}
          className="gap-3 py-2.5"
          trailing={
            event.canManage && p.status === 'PENDING' ? (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => onApprove(p.userId)}
                  title={m.event_approve()}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-primary/15 text-primary transition hover:bg-primary/25"
                >
                  <FontAwesomeIcon icon={faCheck} className="text-xs" />
                </button>
                <button
                  onClick={() => onReject(p.userId)}
                  title={m.event_reject()}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-destructive/15 text-destructive transition hover:bg-destructive/25"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-xs" />
                </button>
              </div>
            ) : (
              <StatusBadge status={p.status} />
            )
          }
        >
          <span className="truncate text-sm text-foreground">
            {p.displayName}
            <span className="text-muted-foreground">#{p.discriminator}</span>
          </span>
        </ListRow>
      ))}
    </SectionCard>
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
