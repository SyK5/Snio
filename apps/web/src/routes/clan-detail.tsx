import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MemberRow } from '@/features/clan/member-row'
import { useClan, useClanMembers, useClanRoles, useDeleteClan, useLeaveClan } from '@/features/clan/clan.hooks'
import { resolveClanError } from '@/features/clan/clan.errors'
import { CreateEventModal } from '@/features/event/create-event-modal'
import { m } from '@/i18n/paraglide/messages'
import type { ClanDetail } from '@/features/clan/clan.types'

export function ClanDetailPage() {
  const { clanId = '' } = useParams()
  const { data: clan, isLoading, error } = useClan(clanId)

  if (isLoading) return <Centered>{m.clan_loading()}</Centered>
  if (error || !clan) return <Centered>{m.clan_not_found()}</Centered>

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Header clan={clan} />
      <MembersSection clanId={clanId} clan={clan} />
    </div>
  )
}

function Header({ clan }: { clan: ClanDetail }) {
  const navigate = useNavigate()
  const leave = useLeaveClan()
  const remove = useDeleteClan()
  const [createOpen, setCreateOpen] = useState(false)

  const onLeave = () => leave.mutate(clan.id, { onSuccess: () => navigate('/clans'), onError: error => toast.error(resolveClanError(error)) })
  const onDelete = () =>
    remove.mutate(clan.id, {
      onSuccess: () => {
        toast.success(m.clan_deleted())
        navigate('/clans')
      },
      onError: error => toast.error(resolveClanError(error)),
    })

  return (
    <div className="mb-8 flex items-start gap-4">
      <Logo url={clan.logoUrl} tag={clan.tag} />
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-foreground">{clan.name}</h1>
        <p className="text-sm text-muted-foreground">
          [{clan.tag}] · {m.clan_member_count({ count: clan.memberCount })}
        </p>
        {clan.description && <p className="mt-2 text-sm text-foreground">{clan.description}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        {clan.canCreateEvent && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            {m.event_create_open()}
          </Button>
        )}
        {clan.isOwner ? (
          <Button size="sm" variant="danger" onClick={onDelete} loading={remove.isPending}>
            {m.clan_delete()}
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={onLeave} loading={leave.isPending}>
            {m.clan_leave()}
          </Button>
        )}
      </div>
      <CreateEventModal clanId={clan.id} open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

function MembersSection({ clanId, clan }: { clanId: string; clan: ClanDetail }) {
  const { data: members, isLoading } = useClanMembers(clanId)
  const canManageRoles = clan.canManageRoles
  const canManageMembers = clan.canManageMembers
  const { data: roles } = useClanRoles(clanId, canManageRoles)

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-foreground">{m.clan_members_title()}</h2>
      {isLoading && <p className="text-sm text-muted-foreground">{m.clan_loading()}</p>}
      <div className="divide-y divide-border">
        {members?.map(member => (
          <MemberRow key={member.id} clanId={clanId} member={member} roles={roles ?? []} canManageMembers={canManageMembers} />
        ))}
      </div>
    </Card>
  )
}

function Logo({ url, tag }: { url: string | null; tag: string }) {
  if (url) return <img src={url} alt={tag} className="h-16 w-16 rounded-2xl object-cover" />
  return <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted text-lg font-bold text-muted-foreground">{tag.slice(0, 2)}</div>
}

function Centered({ children }: { children: string }) {
  return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">{children}</div>
}
