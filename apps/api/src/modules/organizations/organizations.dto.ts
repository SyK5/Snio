import { z } from 'zod'

export const createOrgSchema = z.object({
  name: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(60, 'Maximal 60 Zeichen'),
  description: z.string().trim().max(500).nullable().optional(),
})

export type CreateOrgInput = z.infer<typeof createOrgSchema>

export interface OrgView {
  id: string
  slug: string
  name: string
  description: string | null
  logoUrl: string | null
  verified: boolean
  ownerId: string
  isOwner: boolean
  createdAt: string
}
