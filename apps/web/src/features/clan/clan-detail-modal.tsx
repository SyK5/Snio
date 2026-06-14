import { useState } from 'react'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved, faUsers, faComments, faCalendarDays, faTrophy, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { PagedModal, type PagedModalTab } from '@/components/ui/paged-modal'
import { Button } from '@/components/ui/button'
import { MemberRow } from './member-row'
import { RoleManagerModal } from './role-manager-modal'
import { ClanSettingsModal } from './clan-settings-modal'
import { InviteManagerModal } from './invite-manager-modal'
import { AuditLogModal } from './audit-log-modal'
import { useClan, useClanMembers, useClanRoles, useJoinClan, useLeaveClan } from './clan.hooks'
import { resolveClanError } from './clan.errors'
import { m } from '@/i18n/paraglide/messages'
import type { ClanSummary } from './clan.types'

interface Props {
  clan: ClanSummary
  open: boolean
  onClose: () => void
}

export function ClanDetailModal({ clan, open, onClose }: Props) {
  const [tab, setTab] = useState('members')
  const [rolesOpen, setRolesOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [invitesOpen, setInvitesOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const { data, isLoading } = useClan(clan.id)
  const leave = useLeaveClan()
  const join = useJoinClan()

  const isMember = !!data
  const isOwner = data?.isOwner ?? false
  const canManage = data?.canManageMembers ?? false
  const canManageRoles = data?.canManageRoles ?? false
  const canEditClan = data?.canEditClan ?? false
  const canInvite = data?.canInvite ?? false
  const canViewAudit = data?.canViewAudit ?? false

  const tabs: PagedModalTab[] = [
    { key: 'members', label: m.clan_tab_members(), icon: faUsers },
    { key: 'chat', label: m.clan_tab_chat(), icon: faComments },
    { key: 'events', label: m.clan_tab_events(), icon: faCalendarDays },
    { key: 'leagues', label: m.clan_tab_leagues(), icon: faTrophy },
  ]

  const onLeave = () => leave.mutate(clan.id, { onSuccess: onClose, onError: err => toast.error(resolveClanError(err)) })
  const onJoin = () => join.mutate(clan.id, { onError: err => toast.error(resolveClanError(err)) })

  const actions = isLoading ? null : (
    <div className="flex items-center gap-2">
      {canManageRoles && (
        <Button size="sm" variant="ghost" onClick={() => setRolesOpen(true)}>
          {m.clan_roles_manage()}
        </Button>
      )}
      {canEditClan && (
        <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>
          {m.clan_settings_action()}
        </Button>
      )}
      {canInvite && (
        <Button size="sm" variant="ghost" onClick={() => setInvitesOpen(true)}>
          {m.clan_invite_action()}
        </Button>
      )}
      {canViewAudit && (
        <Button size="sm" variant="ghost" onClick={() => setAuditOpen(true)}>
          {m.clan_audit_action()}
        </Button>
      )}
      {!isMember && clan.joinPolicy === 'OPEN' && (
        <Button size="sm" onClick={onJoin} loading={join.isPending}>
          {m.clan_join()}
        </Button>
      )}
      {!isMember && clan.joinPolicy !== 'OPEN' && (
        <span className="text-xs text-muted-foreground">{clan.joinPolicy === 'INVITE_ONLY' ? m.clan_join_invite_only() : m.clan_join_closed()}</span>
      )}
      {isMember && !isOwner && (
        <Button size="sm" variant="ghost" onClick={onLeave} loading={leave.isPending}>
          {m.clan_leave()}
        </Button>
      )}
    </div>
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
        paused={rolesOpen || settingsOpen || invitesOpen || auditOpen}
      >
        {tab === 'members' && <MembersTab clanId={clan.id} canManageRoles={canManageRoles} canManageMembers={canManage} isLoading={isLoading} description={data?.description ?? null} />}
        {tab === 'chat' && <ComingSoon icon={faComments} />}
        {tab === 'events' && <ComingSoon icon={faCalendarDays} />}
        {tab === 'leagues' && <ComingSoon icon={faTrophy} />}
      </PagedModal>
      <RoleManagerModal clanId={clan.id} isOwner={isOwner} open={rolesOpen} onClose={() => setRolesOpen(false)} />
      <InviteManagerModal clanId={clan.id} open={invitesOpen} onClose={() => setInvitesOpen(false)} />
      <AuditLogModal clanId={clan.id} open={auditOpen} onClose={() => setAuditOpen(false)} />
      {data && (
        <ClanSettingsModal
          clanId={clan.id}
          defaults={{ name: data.name, tag: data.tag, description: data.description ?? '', joinPolicy: data.joinPolicy }}
          isOwner={isOwner}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onDeleted={() => {
            setSettingsOpen(false)
            onClose()
          }}
        />
      )}
    </>
  )
}

function MembersTab({ clanId, canManageRoles, canManageMembers, isLoading, description }: { clanId: string; canManageRoles: boolean; canManageMembers: boolean; isLoading: boolean; description: string | null }) {
  const { data: members, isLoading: loadingMembers } = useClanMembers(clanId)
  const { data: roles, isLoading: loadingRoles } = useClanRoles(clanId, canManageRoles)
  const loading = isLoading || loadingMembers || loadingRoles

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
              <MemberRow key={member.id} clanId={clanId} member={member} roles={roles ?? []} canManageMembers={canManageMembers} />
            ))}
          </div>
        )}
        {!loading && members?.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">{m.table_empty()}</p>}
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
