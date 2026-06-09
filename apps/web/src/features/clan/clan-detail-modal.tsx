import { useState } from 'react'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved, faUsers, faComments, faCalendarDays, faTrophy } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { PagedModal, type PagedModalTab } from '@/components/ui/paged-modal'
import { Button } from '@/components/ui/button'
import { MemberRow } from './member-row'
import { RoleManagerModal } from './role-manager-modal'
import { useClan, useClanMembers, useDeleteClan, useJoinClan, useLeaveClan } from './clan.hooks'
import { resolveClanError } from './clan.errors'
import { m } from '@/i18n/paraglide/messages'
import type { ClanRoleView, ClanSummary } from './clan.types'

interface Props {
  clan: ClanSummary
  open: boolean
  onClose: () => void
}

export function ClanDetailModal({ clan, open, onClose }: Props) {
  const [tab, setTab] = useState('members')
  const [rolesOpen, setRolesOpen] = useState(false)
  const { data, isLoading } = useClan(clan.id)
  const leave = useLeaveClan()
  const remove = useDeleteClan()
  const join = useJoinClan()

  const isMember = !!data
  const isOwner = data?.isOwner ?? false
  const canManage = data?.canManageMembers ?? false
  const canManageRoles = data?.canManageRoles ?? false

  const tabs: PagedModalTab[] = [
    { key: 'members', label: m.clan_tab_members(), icon: faUsers },
    { key: 'chat',    label: m.clan_tab_chat(),    icon: faComments },
    { key: 'events',  label: m.clan_tab_events(),  icon: faCalendarDays },
    { key: 'leagues', label: m.clan_tab_leagues(), icon: faTrophy },
  ]

  const onLeave = () => leave.mutate(clan.id, { onSuccess: onClose, onError: err => toast.error(resolveClanError(err)) })
  const onDelete = () => remove.mutate(clan.id, { onSuccess: () => { toast.success(m.clan_deleted()); onClose() }, onError: err => toast.error(resolveClanError(err)) })
  const onJoin = () => join.mutate(clan.id, { onError: err => toast.error(resolveClanError(err)) })

  const actions = isLoading ? null : (
    <>
      {canManageRoles && <Button size="sm" variant="ghost" onClick={() => setRolesOpen(true)}>{m.clan_roles_manage()}</Button>}
      {isOwner ? (
        <Button size="sm" variant="danger" onClick={onDelete} loading={remove.isPending}>{m.clan_delete()}</Button>
      ) : isMember ? (
        <Button size="sm" variant="ghost" onClick={onLeave} loading={leave.isPending}>{m.clan_leave()}</Button>
      ) : (
        <Button size="sm" onClick={onJoin} loading={join.isPending}>{m.clan_join()}</Button>
      )}
    </>
  )

  return (
    <>
      <PagedModal
        open={open}
        onClose={onClose}
        icon={faShieldHalved}
        title={clan.name}
        subtitle={`[${clan.tag}] · ${m.clan_member_count({ count: clan.memberCount })}`}
        size="lg"
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
        actions={actions}
        bodyClassName="p-0"
        paused={rolesOpen}
      >
        {tab === 'members' && <MembersTab clanId={clan.id} canManage={canManage} isLoading={isLoading} description={data?.description ?? null} />}
        {tab === 'chat' && <ComingSoon icon={faComments} />}
        {tab === 'events' && <ComingSoon icon={faCalendarDays} />}
        {tab === 'leagues' && <ComingSoon icon={faTrophy} />}
      </PagedModal>
      <RoleManagerModal clanId={clan.id} isOwner={isOwner} open={rolesOpen} onClose={() => setRolesOpen(false)} />
    </>
  )
}

function MembersTab({ clanId, canManage, isLoading, description }: { clanId: string; canManage: boolean; isLoading: boolean; description: string | null }) {
  const { data: members, isLoading: loadingMembers } = useClanMembers(clanId)
  const roles = deriveRoles(members)
  const loading = isLoading || loadingMembers

  return (
    <div className="flex flex-col">
      {description && (
        <div className="border-b border-border px-6 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      )}
      <div className="px-6 py-2">
        {loading && <LoadingRows />}
        {!loading && (
          <div className="divide-y divide-border">
            {members?.map(member => (
              <MemberRow key={member.id} clanId={clanId} member={member} roles={roles} canManage={canManage} />
            ))}
          </div>
        )}
        {!loading && members?.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">{m.table_empty()}</p>
        )}
      </div>
    </div>
  )
}

function ComingSoon({ icon }: { icon: IconDefinition }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-muted-foreground">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-muted text-base">
        <FontAwesomeIcon icon={icon} />
      </span>
      <p className="text-sm">{m.clan_coming_soon()}</p>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

function deriveRoles(members: { roles: ClanRoleView[] }[] | undefined): ClanRoleView[] {
  const map = new Map<string, ClanRoleView>()
  for (const member of members ?? []) for (const role of member.roles) map.set(role.id, role)
  return [...map.values()].sort((a, b) => b.position - a.position)
}
