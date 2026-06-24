export interface ClanRoleView {
  id: string
  key: string
  name: string
  color: string | null
  position: number
  manageable: boolean
}

export type JoinPolicy = 'OPEN' | 'INVITE_ONLY' | 'CLOSED'

export interface ClanSummary {
  id: string
  slug: string
  name: string
  tag: string
  logoUrl: string | null
  memberCount: number
  joinPolicy: JoinPolicy
}

export interface ClanDetail extends ClanSummary {
  description: string | null
  ownerId: string
  isOwner: boolean
  canManageMembers: boolean
  canManageRoles: boolean
  canEditClan: boolean
  canInvite: boolean
  canViewAudit: boolean
  canCreateEvent: boolean
  createdAt: string
}

export interface ClanPage {
  items: ClanSummary[]
  nextCursor: string | null
}

export interface ClanMemberView {
  id: string
  userId: string
  username: string
  displayName: string
  discriminator: string
  avatarUrl: string | null
  joinedAt: string
  roles: ClanRoleView[]
}

export interface CreateClanPayload {
  name: string
  tag: string
  description?: string
}

export interface UpdateClanPayload {
  name?: string
  tag?: string
  description?: string | null
  joinPolicy?: JoinPolicy
}

export interface ClanRoleGrantView {
  grant: string
  actions: number
}

export interface ClanRoleDetail {
  id: string
  key: string
  name: string
  color: string | null
  position: number
  isSystem: boolean
  manageable: boolean
  grants: ClanRoleGrantView[]
}

export interface GrantCatalogEntry {
  key: string
  category: string
  actions: number
}

export interface RoleTemplateView {
  key: string
  name: string
  color: string | null
}

export interface CreateRolePayload {
  name?: string
  color?: string | null
  template?: string
}

export interface UpdateRolePayload {
  name?: string
  color?: string | null
}

export interface InviteTargetView {
  userId: string
  username: string
  displayName: string
  discriminator: string
}

export interface InviteView {
  id: string
  code: string
  target: InviteTargetView | null
  maxUses: number | null
  uses: number
  expiresAt: string | null
  createdAt: string
}

export interface InvitePreview {
  code: string
  clanId: string
  slug: string
  name: string
  tag: string
  targeted: boolean
}

export interface CreateLinkPayload {
  maxUses?: number | null
  expiresAt?: string | null
}

export interface CreateTargetedPayload {
  username: string
  discriminator: string
}

export interface AuditActorView {
  userId: string
  username: string
  displayName: string
  discriminator: string
}

export interface AuditLogView {
  id: string
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown>
  actor: AuditActorView | null
  createdAt: string
}

export interface AuditLogPage {
  items: AuditLogView[]
  nextCursor: string | null
}
