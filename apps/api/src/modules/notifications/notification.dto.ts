import { z } from 'zod'

export const NOTIFIABLE_TYPES = ['CLAN_INVITE', 'CLAN_MEMBER_JOINED', 'CLAN_ROLE_CHANGED', 'CLAN_KICKED'] as const
export type NotifiableType = (typeof NOTIFIABLE_TYPES)[number]

export const NOTIFICATION_CATEGORIES = {
  invite: ['CLAN_INVITE'],
  member: ['CLAN_MEMBER_JOINED', 'CLAN_KICKED'],
  role: ['CLAN_ROLE_CHANGED'],
} as const satisfies Record<string, readonly NotifiableType[]>

export type NotificationCategory = keyof typeof NOTIFICATION_CATEGORIES

export const listNotificationsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum(['invite', 'member', 'role']).optional(),
  unreadOnly: z.coerce.boolean().optional(),
})

export const setPreferenceSchema = z.object({
  enabled: z.boolean(),
})

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>
export type SetPreferenceInput = z.infer<typeof setPreferenceSchema>

export interface NotificationView {
  id: string
  type: string
  payload: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

export interface NotificationPage {
  items: NotificationView[]
  nextCursor: string | null
}

export interface NotificationPreferenceView {
  type: NotifiableType
  enabled: boolean
}
