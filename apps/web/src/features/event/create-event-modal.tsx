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
import { useGames } from '@/features/game/game.hooks'
import { useCreateClanEvent } from './event.hooks'
import { resolveEventError } from './event.errors'
import { createEventForm, type CreateEventForm } from './event.schemas'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import type { CreateEventPayload } from './event.types'

const toIso = (v?: string) => (v ? new Date(v).toISOString() : null)

export function CreateEventModal({ clanId, open, onClose }: { clanId: string; open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { data: games } = useGames()
  const create = useCreateClanEvent(clanId)
  const { register, handleSubmit, watch, setValue, reset, formState } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventForm),
    mode: 'onTouched',
    defaultValues: { gameId: '', visibility: 'PRIVATE', registrationPolicy: 'INVITE_ONLY', requiresApproval: false },
  })

  const close = () => {
    reset()
    onClose()
  }

  const submit = handleSubmit(values => {
    const payload: CreateEventPayload = {
      gameId: values.gameId,
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
    create.mutate(payload, {
      onSuccess: event => {
        toast.success(m.event_created())
        reset()
        onClose()
        navigate(`/events/${event.id}`)
      },
      onError: error => toast.error(resolveEventError(error)),
    })
  })

  const gameId = watch('gameId')
  const visibility = watch('visibility')
  const policy = watch('registrationPolicy')
  const requiresApproval = watch('requiresApproval')

  return (
    <Modal
      open={open}
      onClose={close}
      icon={faCalendarPlus}
      size="lg"
      title={m.event_create_title()}
      subtitle={m.event_create_subtitle()}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {m.event_cancel()}
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            {m.event_create_action()}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
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
