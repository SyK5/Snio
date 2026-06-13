import { m } from '@/i18n/paraglide/messages'
import type { AuditLogView } from './clan.types'

export function auditActorLabel(e: AuditLogView): string {
  return e.actor ? handle(e.actor.displayName, e.actor.discriminator) : m.audit_actor_system()
}

export function auditText(e: AuditLogView): string {
  const p = e.metadata as Record<string, unknown>
  switch (e.action) {
    case 'clan.updated':
      return m.audit_clan_updated()
    case 'clan.deleted':
      return m.audit_clan_deleted()
    case 'member.joined':
      return m.audit_member_joined()
    case 'member.left':
      return m.audit_member_left()
    case 'member.kicked':
      return m.audit_member_kicked()
    case 'role.assigned':
      return m.audit_role_assigned({ role: str(p.roleName) })
    case 'role.removed':
      return m.audit_role_removed({ role: str(p.roleName) })
    case 'role.created':
      return m.audit_role_created({ role: str(p.name) })
    case 'role.updated':
      return m.audit_role_updated()
    case 'role.deleted':
      return m.audit_role_deleted({ role: str(p.name) })
    case 'role.reordered':
      return m.audit_role_reordered()
    case 'role.grants_set':
      return m.audit_role_grants_set()
    case 'invite.created':
      return m.audit_invite_created()
    case 'invite.revoked':
      return m.audit_invite_revoked()
    case 'invite.redeemed':
      return m.audit_invite_redeemed()
    default:
      return e.action
  }
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function handle(name?: string, discriminator?: string): string {
  return discriminator ? `${name}#${discriminator}` : (name ?? '')
}
