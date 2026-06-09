import { z } from 'zod'

export const listClansSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListClansQuery = z.infer<typeof listClansSchema>

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
  })
  .refine((d) => Object.keys(d).length > 0, 'Keine Änderungen übergeben')

export const assignRoleSchema = z.object({
  roleId: z.string().min(1).max(40),
})

export type CreateClanInput = z.infer<typeof createClanSchema>
export type UpdateClanInput = z.infer<typeof updateClanSchema>
export type AssignRoleInput = z.infer<typeof assignRoleSchema>

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
