import { z } from 'zod'

export type JoinPolicy = 'OPEN' | 'INVITE_ONLY' | 'CLOSED'

export const createLinkSchema = z.object({
  maxUses: z.coerce.number().int().min(1).max(1000).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
})

export const createTargetedSchema = z.object({
  username: z.string().trim().min(1).max(40),
  discriminator: z.string().regex(/^[0-9]{4}$/, 'Discriminator: 4 Ziffern'),
})

export type CreateLinkInput = z.infer<typeof createLinkSchema>
export type CreateTargetedInput = z.infer<typeof createTargetedSchema>

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
