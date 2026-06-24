import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { ListRow } from '@/components/ui/list-row'
import { RoleBadge } from './role-badge'
import { useAssignRole, useKickMember, useRemoveRole } from './clan.hooks'
import { resolveClanError } from './clan.errors'
import { useDismiss } from '@/hooks/use-dismiss'
import { m } from '@/i18n/paraglide/messages'
import type { ClanMemberView, ClanRoleView } from './clan.types'

export function MemberRow({ clanId, member, roles, canManageMembers }: { clanId: string; member: ClanMemberView; roles: ClanRoleView[]; canManageMembers: boolean }) {
  const [picking, setPicking] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const assign = useAssignRole(clanId)
  const remove = useRemoveRole(clanId)
  const kick = useKickMember(clanId)
  useDismiss(pickerRef, picking, () => setPicking(false))

  const assigned = new Set(member.roles.map(r => r.id))
  const assignable = roles.filter(r => !assigned.has(r.id) && r.manageable)

  const onRemoveRole = (roleId: string) => remove.mutate({ memberId: member.id, roleId }, { onError: err => toast.error(resolveClanError(err)) })
  const onAssign = (roleId: string) => {
    setPicking(false)
    assign.mutate({ memberId: member.id, roleId }, { onError: err => toast.error(resolveClanError(err)) })
  }
  const onKick = () => kick.mutate(member.id, { onSuccess: () => toast.success(m.clan_member_kicked()), onError: err => toast.error(resolveClanError(err)) })

  return (
    <ListRow
      className="gap-4 py-4"
      media={<Avatar src={member.avatarUrl} fallback={member.displayName.slice(0, 1).toUpperCase()} size={44} circle />}
      trailing={
        (assignable.length > 0 || canManageMembers) && (
          <div ref={pickerRef} className="relative flex shrink-0 items-center gap-2">
            {assignable.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setPicking(v => !v)}>
                {m.clan_role_add()}
              </Button>
            )}
            {canManageMembers && (
              <Button size="sm" variant="danger" onClick={onKick} loading={kick.isPending}>
                {m.clan_member_kick()}
              </Button>
            )}
            {picking && (
              <Card padding="none" className="absolute right-0 top-10 z-20 w-48 p-1.5 shadow-2xl">
                {assignable.map(role => (
                  <button
                    key={role.id}
                    onClick={() => onAssign(role.id)}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: role.color ?? 'var(--color-muted-foreground)' }} />
                    {role.name}
                  </button>
                ))}
              </Card>
            )}
          </div>
        )
      }
    >
      <div className="flex items-baseline gap-1.5">
        <span className="truncate text-sm font-semibold text-foreground">{member.displayName}</span>
        <span className="shrink-0 text-xs text-muted-foreground">#{member.discriminator}</span>
      </div>
      {member.roles.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {member.roles.map(role => (
            <RoleBadge key={role.id} role={role} removable={role.manageable} onRemove={() => onRemoveRole(role.id)} />
          ))}
        </div>
      )}
    </ListRow>
  )
}
