export const AuditAction = {
  CLAN_UPDATED: 'clan.updated',
  CLAN_DELETED: 'clan.deleted',
  MEMBER_JOINED: 'member.joined',
  MEMBER_LEFT: 'member.left',
  MEMBER_KICKED: 'member.kicked',
  ROLE_ASSIGNED: 'role.assigned',
  ROLE_REMOVED: 'role.removed',
  ROLE_CREATED: 'role.created',
  ROLE_UPDATED: 'role.updated',
  ROLE_DELETED: 'role.deleted',
  ROLE_REORDERED: 'role.reordered',
  ROLE_GRANTS_SET: 'role.grants_set',
  INVITE_CREATED: 'invite.created',
  INVITE_REVOKED: 'invite.revoked',
  INVITE_REDEEMED: 'invite.redeemed',
} as const

export type AuditActionKey = (typeof AuditAction)[keyof typeof AuditAction]

export const AuditEntity = {
  CLAN: 'clan',
  MEMBER: 'member',
  ROLE: 'role',
  INVITE: 'invite',
} as const

export type AuditEntityType = (typeof AuditEntity)[keyof typeof AuditEntity]
