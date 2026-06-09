import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { TextField, TextArea } from '@/components/ui/field'
import { useCreateClan } from './clan.hooks'
import { resolveClanError } from './clan.errors'
import { createClanSchema, type CreateClanForm } from './clan.schemas'
import { m } from '@/i18n/paraglide/messages'

export function CreateClanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const create = useCreateClan()
  const { register, handleSubmit, watch, reset, formState } = useForm<CreateClanForm>({ resolver: zodResolver(createClanSchema), mode: 'onTouched' })

  const close = () => {
    reset()
    onClose()
  }

  const submit = handleSubmit(values =>
    create.mutate(values, {
      onSuccess: clan => {
        toast.success(m.clan_created())
        reset()
        onClose()
        navigate(`/clans/${clan.id}`)
      },
      onError: error => toast.error(resolveClanError(error)),
    }),
  )

  const name = watch('name')?.trim()
  const tag = (watch('tag') ?? '').trim().toUpperCase()

  return (
    <Modal
      open={open}
      onClose={close}
      icon={faShieldHalved}
      title={m.clan_create_title()}
      subtitle={m.clan_create_subtitle()}
      footer={
        <>
          <Button variant="ghost" onClick={close}>{m.clan_cancel()}</Button>
          <Button onClick={submit} loading={create.isPending}>{m.clan_create_action()}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={m.clan_field_name()} error={formState.errors.name?.message} maxLength={40} {...register('name')} />
        <TextField label={m.clan_field_tag()} error={formState.errors.tag?.message} maxLength={8} {...register('tag')} />
        <TextArea label={m.clan_field_description()} error={formState.errors.description?.message} maxLength={500} rows={3} {...register('description')} />

        <div className="mt-1 flex items-center gap-3 rounded-xl border border-border bg-surface-muted p-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-accent text-sm font-bold text-accent-foreground">
            {tag ? tag.slice(0, 2) : <FontAwesomeIcon icon={faShieldHalved} />}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">{name || m.clan_create_name_placeholder()}</div>
            <div className="truncate text-xs text-muted-foreground">{tag ? `[${tag}] · ` : ''}{m.clan_create_owner_hint()}</div>
          </div>
        </div>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}
