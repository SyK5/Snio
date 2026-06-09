export interface ClanRoleView {
  id: string
  key: string
  name: string
  color: string | null
  position: number
}

export interface ClanSummary {
  id: string
  slug: string
  name: string
  tag: string
  logoUrl: string | null
  memberCount: number
}

export interface ClanDetail extends ClanSummary {
  description: string | null
  ownerId: string
  isOwner: boolean
  canManageMembers: boolean
  canManageRoles: boolean
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
  grants: ClanRoleGrantView[]
}

export interface GrantCatalogEntry {
  key: string
  category: string
  actions: number
}

export interface CreateRolePayload {
  name: string
  color?: string | null
}

export interface UpdateRolePayload {
  name?: string
  color?: string | null
}
