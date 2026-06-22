import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'
import { useMarkRead, useNotifications } from './notification.hooks'
import { notificationLink, notificationText, timeAgo } from './notification-text'
import type { NotificationView } from './notification.types'

interface Props {
  enabled: boolean
  category?: string
  unreadOnly?: boolean
  onClose?: () => void
}

export function NotificationList({ enabled, category, unreadOnly, onClose }: Props) {
  const navigate = useNavigate()
  const markRead = useMarkRead()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotifications(enabled, category, unreadOnly)
  const items = data?.pages.flatMap(p => p.items) ?? []

  const onItem = (n: NotificationView) => {
    if (!n.readAt) markRead.mutate(n.id)
    onClose?.()
    const link = notificationLink(n)
    if (link) navigate(link)
  }

  if (isLoading) return <p className="px-4 py-6 text-center text-sm text-muted-foreground">{m.clan_loading()}</p>
  if (items.length === 0) return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{m.notif_empty()}</p>

  return (
    <>
      {items.map(n => (
        <button
          key={n.id}
          onClick={() => onItem(n)}
          className={cn('flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition hover:bg-muted', !n.readAt && 'bg-primary/5')}
        >
          <span className="text-sm text-foreground">{notificationText(n)}</span>
          <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
        </button>
      ))}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full cursor-pointer px-4 py-3 text-center text-xs text-muted-foreground transition hover:text-foreground"
        >
          {m.notif_load_more()}
        </button>
      )}
    </>
  )
}
