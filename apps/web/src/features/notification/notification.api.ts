import { api } from '@/lib/api'
import type { NotificationPage, NotificationPreference, NotificationType } from './notification.types'

export const notificationApi = {
  list: (cursor?: string, category?: string, unreadOnly?: boolean) =>
    api.get<NotificationPage>('/notifications', { params: { ...(cursor ? { cursor } : {}), ...(category ? { category } : {}), ...(unreadOnly ? { unreadOnly: true } : {}) } }).then(r => r.data),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then(r => r.data),
  markRead: (id: string) => api.post(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.post('/notifications/read-all').then(r => r.data),
  preferences: () => api.get<NotificationPreference[]>('/notifications/preferences').then(r => r.data),
  setPreference: (type: NotificationType, enabled: boolean) => api.put<NotificationPreference>(`/notifications/preferences/${type}`, { enabled }).then(r => r.data),
}
