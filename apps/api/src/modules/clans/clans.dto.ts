import { z } from 'zod'

export const listClansSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListClansQuery = z.infer<typeof listClansSchema>

export type JoinPolicy = 'OPEN' | 'INVITE_ONLY' | 'CLOSED'

export interface ClanPage {
  items: ClanSummary[]
  nextCursor: string | null
}

const tagField = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.string().regex(/^[A-Z0-9]{2,8}$/, 'Tag: 2 bis 8 Zeichen, nur A-Z und 0-9'))

export const createClanSchema = z.object({
  name: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(40, 'Maximal 40 Zeichen'),
  tag: tagField,
  description: z.string().trim().max(500).optional(),
})

export const updateClanSchema = z
  .object({
    name: z.string().trim().min(2).max(40).optional(),
    tag: tagField.optional(),
    description: z.string().trim().max(500).nullable().optional(),
    joinPolicy: z.enum(['OPEN', 'INVITE_ONLY', 'CLOSED']).optional(),
  })
  .refine(d => Object.keys(d).length > 0, 'Keine Änderungen übergeben')

export const assignRoleSchema = z.object({
  roleId: z.string().min(1).max(40),
})

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Farbe muss ein Hex Wert sein wie #1b2c3d')

export const createRoleSchema = z
  .object({
    name: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(40, 'Maximal 40 Zeichen').optional(),
    color: hexColor.nullable().optional(),
    template: z.string().min(1).max(40).optional(),
  })
  .refine(d => !!d.template || (!!d.name && d.name.trim().length >= 2), 'Name oder Template erforderlich')

export const updateRoleSchema = z
  .object({
    name: z.string().trim().min(2).max(40).optional(),
    color: hexColor.nullable().optional(),
  })
  .refine(d => Object.keys(d).length > 0, 'Keine Änderungen übergeben')

export const reorderRolesSchema = z.object({
  roleIds: z.array(z.string().min(1)).min(1),
})

export const setGrantsSchema = z.object({
  grants: z.array(z.object({ grant: z.string().min(1), actions: z.number().int().min(0).max(31) })),
})

export type CreateClanInput = z.infer<typeof createClanSchema>
export type UpdateClanInput = z.infer<typeof updateClanSchema>
export type AssignRoleInput = z.infer<typeof assignRoleSchema>
export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
export type ReorderRolesInput = z.infer<typeof reorderRolesSchema>
export type SetGrantsInput = z.infer<typeof setGrantsSchema>

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
  joinPolicy: JoinPolicy
}

export interface ClanDetail extends ClanSummary {
  description: string | null
  ownerId: string
  joinPolicy: JoinPolicy
  isOwner: boolean
  canManageMembers: boolean
  canManageRoles: boolean
  canEditClan: boolean
  canInvite: boolean
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

export interface RoleTemplateView {
  key: string
  name: string
  color: string | null
}
