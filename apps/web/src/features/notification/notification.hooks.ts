import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from './notification.api'
import type { NotificationPreference, NotificationType } from './notification.types'

const listKey = ['notifications'] as const
const unreadKey = ['notifications', 'unread'] as const
const prefsKey = ['notification-preferences'] as const

export function useUnreadCount(enabled: boolean) {
  return useQuery({ queryKey: unreadKey, queryFn: () => notificationApi.unreadCount(), enabled, refetchInterval: 30000 })
}

export function useNotifications(enabled: boolean, category?: string, unreadOnly?: boolean) {
  return useInfiniteQuery({
    queryKey: [...listKey, category ?? 'all', unreadOnly ? 'unread' : 'any'],
    queryFn: ({ pageParam }) => notificationApi.list(pageParam, category, unreadOnly),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
    enabled,
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKey })
      qc.invalidateQueries({ queryKey: unreadKey })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKey })
      qc.invalidateQueries({ queryKey: unreadKey })
    },
  })
}

export function useNotificationPreferences() {
  return useQuery({ queryKey: prefsKey, queryFn: () => notificationApi.preferences() })
}

export function useSetPreference() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ type, enabled }: { type: NotificationType; enabled: boolean }) => notificationApi.setPreference(type, enabled),
    onMutate: async ({ type, enabled }) => {
      await qc.cancelQueries({ queryKey: prefsKey })
      const prev = qc.getQueryData<NotificationPreference[]>(prefsKey)
      qc.setQueryData<NotificationPreference[]>(prefsKey, p => p?.map(x => (x.type === type ? { ...x, enabled } : x)) ?? p)
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(prefsKey, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: prefsKey }),
  })
}
