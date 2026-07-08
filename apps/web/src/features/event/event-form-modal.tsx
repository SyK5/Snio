import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarPlus, faCheck } from '@fortawesome/free-solid-svg-icons'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { TextField, TextArea } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { Avatar } from '@/components/ui/avatar'
import { useMyClans } from '@/features/clan/clan.hooks'
import { useGames } from '@/features/game/game.hooks'
import { useCreateClanEvent, useUpdateEvent } from './event.hooks'
import { resolveEventError } from './event.errors'
import { createEventForm, type CreateEventForm } from './event.schemas'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import type { CreateEventPayload, EventDetailView, UpdateEventPayload } from './event.types'

const toIso = (v?: string) => (v ? new Date(v).toISOString() : null)

const toLocal = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function EventFormModal({ open, onClose, event }: { open: boolean; onClose: () => void; event?: EventDetailView }) {
  const editing = !!event
  const navigate = useNavigate()
  const { data: games } = useGames()
  const { data: myClans } = useMyClans()
  const create = useCreateClanEvent()
  const update = useUpdateEvent(event?.organizer.id ?? '')
  const eligibleClans = (myClans ?? []).filter(c => c.canCreateEvent)

  const { register, handleSubmit, watch, setValue, reset, formState } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventForm),
    mode: 'onTouched',
    defaultValues: { clanId: '', gameId: '', visibility: 'PRIVATE', registrationPolicy: 'INVITE_ONLY', requiresApproval: false },
  })

  const clanId = watch('clanId')
  const gameId = watch('gameId')
  const visibility = watch('visibility')
  const policy = watch('registrationPolicy')
  const requiresApproval = watch('requiresApproval')

  useEffect(() => {
    if (!open || !event) return
    reset({
      clanId: event.organizer.id ?? '',
      gameId: event.game.id,
      title: event.title,
      description: event.description ?? '',
      visibility: event.visibility,
      registrationPolicy: event.registrationPolicy,
      requiresApproval: event.requiresApproval,
      startsAt: toLocal(event.startsAt),
      endsAt: toLocal(event.endsAt),
      registrationOpensAt: toLocal(event.registrationOpensAt),
      registrationClosesAt: toLocal(event.registrationClosesAt),
      location: event.location ?? '',
      ruleset: event.ruleset ?? '',
    })
  }, [open, event, reset])

  useEffect(() => {
    if (editing) return
    if (eligibleClans.length === 1 && !clanId) setValue('clanId', eligibleClans[0]!.id)
  }, [editing, eligibleClans.length, clanId, setValue])

  const close = () => {
    reset()
    onClose()
  }

  const submit = handleSubmit(values => {
    const shared = {
      title: values.title,
      description: values.description || null,
      visibility: values.visibility,
      registrationPolicy: values.registrationPolicy,
      requiresApproval: values.registrationPolicy === 'OPEN' ? values.requiresApproval : false,
      startsAt: toIso(values.startsAt)!,
      endsAt: toIso(values.endsAt),
      registrationOpensAt: toIso(values.registrationOpensAt),
      registrationClosesAt: toIso(values.registrationClosesAt),
      location: values.location || null,
      ruleset: values.ruleset || null,
    }
    if (event) {
      update.mutate(
        { eventId: event.id, payload: shared as UpdateEventPayload },
        {
          onSuccess: () => {
            toast.success(m.event_updated())
            onClose()
          },
          onError: error => toast.error(resolveEventError(error)),
        },
      )
      return
    }
    create.mutate(
      { clanId: values.clanId, payload: { gameId: values.gameId, ...shared } as CreateEventPayload },
      {
        onSuccess: created => {
          toast.success(m.event_created())
          reset()
          onClose()
          navigate(`/events/${created.id}`)
        },
        onError: error => toast.error(resolveEventError(error)),
      },
    )
  })

  return (
    <Modal
      open={open}
      onClose={close}
      icon={faCalendarPlus}
      size="lg"
      title={editing ? m.event_edit_title() : m.event_create_title()}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {m.event_cancel()}
          </Button>
          <Button onClick={submit} loading={create.isPending || update.isPending}>
            {editing ? m.event_save() : m.event_create_action()}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {!editing && eligibleClans.length > 1 && (
          <Labeled label={m.event_field_clan()} error={formState.errors.clanId?.message}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {eligibleClans.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setValue('clanId', c.id, { shouldValidate: true })}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                    clanId === c.id ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Avatar src={c.logoUrl} fallback={c.tag.slice(0, 2)} size={24} />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </Labeled>
        )}

        {!editing && (
          <Labeled label={m.event_field_game()} error={formState.errors.gameId?.message}>
            {games?.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {games.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setValue('gameId', g.id, { shouldValidate: true })}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                      gameId === g.id ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {g.iconUrl ? (
                      <img src={g.iconUrl} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-muted text-xs font-bold">{g.name.slice(0, 2).toUpperCase()}</span>
                    )}
                    <span className="truncate">{g.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{m.event_create_no_games()}</p>
            )}
          </Labeled>
        )}

        <TextField label={m.event_field_title()} error={formState.errors.title?.message} maxLength={120} {...register('title')} />
        <TextArea label={m.event_field_description()} error={formState.errors.description?.message} maxLength={2000} rows={3} {...register('description')} />

        <Labeled label={m.event_field_visibility()}>
          <Segmented
            value={visibility}
            onChange={v => setValue('visibility', v)}
            options={[
              { value: 'PRIVATE', label: m.event_visibility_private() },
              { value: 'PUBLIC', label: m.event_visibility_public() },
            ]}
          />
        </Labeled>

        <Labeled label={m.event_field_policy()}>
          <Segmented
            value={policy}
            onChange={v => setValue('registrationPolicy', v)}
            options={[
              { value: 'OPEN', label: m.event_policy_open() },
              { value: 'INVITE_ONLY', label: m.event_policy_invite_only() },
              { value: 'CLOSED', label: m.event_policy_closed() },
            ]}
          />
        </Labeled>

        {policy === 'OPEN' && (
          <button
            type="button"
            onClick={() => setValue('requiresApproval', !requiresApproval)}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted p-3 text-left"
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition',
                requiresApproval ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
              )}
            >
              {requiresApproval && <FontAwesomeIcon icon={faCheck} className="text-[0.6rem]" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{m.event_field_approval()}</span>
              <span className="block text-xs text-muted-foreground">{m.event_field_approval_hint()}</span>
            </span>
          </button>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField type="datetime-local" label={m.event_field_starts()} error={formState.errors.startsAt?.message} {...register('startsAt')} />
          <TextField type="datetime-local" label={m.event_field_ends()} error={formState.errors.endsAt?.message} {...register('endsAt')} />
          <TextField type="datetime-local" label={m.event_field_reg_opens()} {...register('registrationOpensAt')} />
          <TextField type="datetime-local" label={m.event_field_reg_closes()} error={formState.errors.registrationClosesAt?.message} {...register('registrationClosesAt')} />
        </div>

        <TextField label={m.event_field_location()} error={formState.errors.location?.message} maxLength={200} {...register('location')} />
        <TextArea label={m.event_field_ruleset()} error={formState.errors.ruleset?.message} maxLength={5000} rows={3} {...register('ruleset')} />
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}

function Labeled({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
