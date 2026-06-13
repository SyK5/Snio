export type NotificationType = 'CLAN_INVITE' | 'CLAN_MEMBER_JOINED' | 'CLAN_ROLE_CHANGED' | 'CLAN_KICKED'

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

export interface NotificationPreference {
  type: NotificationType
  enabled: boolean
}
