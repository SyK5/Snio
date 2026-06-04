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
  createdAt: string
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
