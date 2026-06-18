import { z } from 'zod'

export const createEventInviteLinkSchema = z.object({
  maxUses: z.coerce.number().int().min(1).max(1000).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
})

export const createEventInviteTargetedSchema = z.object({
  username: z.string().trim().min(1).max(40),
  discriminator: z.string().regex(/^[0-9]{4}$/, 'Discriminator: 4 Ziffern'),
})

export type CreateEventInviteLinkInput = z.infer<typeof createEventInviteLinkSchema>
export type CreateEventInviteTargetedInput = z.infer<typeof createEventInviteTargetedSchema>

export interface EventInviteTargetView {
  userId: string
  username: string
  displayName: string
  discriminator: string
}

export interface EventInviteView {
  id: string
  code: string
  target: EventInviteTargetView | null
  maxUses: number | null
  uses: number
  expiresAt: string | null
  createdAt: string
}

export interface EventInvitePreview {
  code: string
  eventId: string
  title: string
  targeted: boolean
}
