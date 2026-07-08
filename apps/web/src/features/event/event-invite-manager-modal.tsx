import { useState } from 'react'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faLink, faPaperPlane, faTrash, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { useCreateEventLink, useCreateEventTargeted, useEventInvites, useRevokeEventInvite } from './event-invite.hooks'
import { resolveEventError } from './event.errors'
import { m } from '@/i18n/paraglide/messages'
import type { EventInviteView } from './event.types'

interface Props {
  clanId: string
  eventId: string
  open: boolean
  onClose: () => void
}

export function EventInviteManagerModal({ clanId, eventId, open, onClose }: Props) {
  const { data: invites, isLoading } = useEventInvites(clanId, eventId, open)
  const createLink = useCreateEventLink(clanId, eventId)
  const revoke = useRevokeEventInvite(clanId, eventId)

  const onCreateLink = () => createLink.mutate({}, { onError: e => toast.error(resolveEventError(e)) })
  const onRevoke = (id: string) => revoke.mutate(id, { onSuccess: () => toast.success(m.invite_revoked_toast()), onError: e => toast.error(resolveEventError(e)) })

  return (
    <Modal open={open} onClose={onClose} icon={faUserPlus} title={m.event_invites_title()} subtitle={m.event_invites_subtitle()} size="lg">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{m.invite_link_section()}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{m.invite_link_hint()}</p>
            </div>
            <Button size="sm" onClick={onCreateLink} loading={createLink.isPending}>
              <FontAwesomeIcon icon={faLink} className="mr-2 text-xs" />
              {m.invite_link_create()}
            </Button>
          </div>
        </section>

        <TargetedInvite clanId={clanId} eventId={eventId} />

        <section className="flex flex-col gap-2 border-t border-border pt-5">
          <h3 className="text-sm font-semibold text-foreground">{m.invite_list_title()}</h3>
          {isLoading && <p className="py-4 text-sm text-muted-foreground">{m.event_loading()}</p>}
          {!isLoading && invites?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{m.invite_empty()}</p>}
          <div className="divide-y divide-border">
            {invites?.map(invite => (
              <InviteRow key={invite.id} invite={invite} onRevoke={() => onRevoke(invite.id)} revoking={revoke.isPending} />
            ))}
          </div>
        </section>
      </div>
    </Modal>
  )
}

function TargetedInvite({ clanId, eventId }: { clanId: string; eventId: string }) {
  const [handle, setHandle] = useState('')
  const create = useCreateEventTargeted(clanId, eventId)

  const submit = () => {
    const [username, discriminator] = handle.trim().split('#')
    if (!username || !discriminator || !/^[0-9]{4}$/.test(discriminator)) return toast.error(m.invite_error_user_not_found())
    create.mutate(
      { username, discriminator },
      {
        onSuccess: () => {
          toast.success(m.invite_targeted_sent())
          setHandle('')
        },
        onError: e => toast.error(resolveEventError(e)),
      },
    )
  }

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{m.invite_targeted_section()}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{m.invite_targeted_hint()}</p>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField label={m.invite_targeted_username()} placeholder="spieler#1234" value={handle} onChange={e => setHandle(e.target.value)} />
        </div>
        <Button onClick={submit} loading={create.isPending}>
          <FontAwesomeIcon icon={faPaperPlane} className="mr-2 text-xs" />
          {m.invite_targeted_action()}
        </Button>
      </div>
    </section>
  )
}

function InviteRow({ invite, onRevoke, revoking }: { invite: EventInviteView; onRevoke: () => void; revoking: boolean }) {
  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/event-invite/${invite.code}`)
    toast.success(m.invite_link_copied())
  }
  const label = invite.target ? m.invite_target_for({ name: `${invite.target.displayName}#${invite.target.discriminator}` }) : m.invite_link_label()

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted text-xs text-muted-foreground">
        <FontAwesomeIcon icon={invite.target ? faUserPlus : faLink} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{m.invite_uses({ count: invite.uses })}</div>
      </div>
      {!invite.target && (
        <Button size="sm" variant="ghost" onClick={copy}>
          <FontAwesomeIcon icon={faCopy} className="mr-2 text-xs" />
          {m.invite_link_copy()}
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onRevoke} loading={revoking}>
        <FontAwesomeIcon icon={faTrash} className="text-xs" />
      </Button>
    </div>
  )
}
