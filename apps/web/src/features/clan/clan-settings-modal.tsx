import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { faGear, faLock, faLockOpen, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { TextField, TextArea } from '@/components/ui/field'
import { useDeleteClan, useUpdateClan } from './clan.hooks'
import { resolveClanError } from './clan.errors'
import { updateClanSchema, type UpdateClanForm } from './clan.schemas'
import { m } from '@/i18n/paraglide/messages'
import type { JoinPolicy } from './clan.types'

interface Props {
  clanId: string
  defaults: { name: string; tag: string; description: string; joinPolicy: JoinPolicy }
  isOwner: boolean
  open: boolean
  onClose: () => void
  onDeleted: () => void
}

export function ClanSettingsModal({ clanId, defaults, isOwner, open, onClose, onDeleted }: Props) {
  const update = useUpdateClan(clanId)
  const del = useDeleteClan()
  const [policy, setPolicy] = useState<JoinPolicy>(defaults.joinPolicy)
  const { register, handleSubmit, formState } = useForm<UpdateClanForm>({ resolver: zodResolver(updateClanSchema), mode: 'onTouched', values: defaults })

  useEffect(() => setPolicy(defaults.joinPolicy), [defaults.joinPolicy, open])

  const submit = handleSubmit(values =>
    update.mutate(
      { ...values, joinPolicy: policy },
      {
        onSuccess: () => {
          toast.success(m.clan_updated())
          onClose()
        },
        onError: error => toast.error(resolveClanError(error)),
      },
    ),
  )

  const onDelete = () =>
    del.mutate(clanId, {
      onSuccess: () => {
        toast.success(m.clan_deleted())
        onDeleted()
      },
      onError: error => toast.error(resolveClanError(error)),
    })

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={faGear}
      title={m.clan_settings_title()}
      subtitle={m.clan_settings_subtitle()}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {m.clan_cancel()}
          </Button>
          <Button onClick={submit} loading={update.isPending}>
            {m.clan_save()}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={m.clan_field_name()} error={formState.errors.name?.message} maxLength={40} {...register('name')} />
        <TextField label={m.clan_field_tag()} error={formState.errors.tag?.message} maxLength={8} {...register('tag')} />
        <TextArea label={m.clan_field_description()} error={formState.errors.description?.message} maxLength={500} rows={3} {...register('description')} />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">{m.clan_join_policy()}</span>
          <Segmented
            value={policy}
            onChange={setPolicy}
            options={[
              { value: 'OPEN', label: m.clan_join_policy_open(), icon: faLockOpen },
              { value: 'INVITE_ONLY', label: m.clan_join_policy_invite_only(), icon: faEnvelope },
              { value: 'CLOSED', label: m.clan_join_policy_closed(), icon: faLock },
            ]}
          />
        </div>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>

      {isOwner && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{m.clan_danger_zone()}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.clan_delete_hint()}</p>
          </div>
          <Button variant="danger" size="sm" onClick={onDelete} loading={del.isPending}>
            {m.clan_delete()}
          </Button>
        </div>
      )}
    </Modal>
  )
}
