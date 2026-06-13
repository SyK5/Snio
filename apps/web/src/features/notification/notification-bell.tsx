import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/features/auth/auth.store'
import { useClickOutside } from '@/hooks/use-click-outside'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from './notification.hooks'
import { notificationLink, notificationText } from './notification-text'
import type { NotificationView } from './notification.types'

export function NotificationBell() {
  const accessToken = useAuthStore(s => s.accessToken)
  if (!accessToken) return null
  return <BellInner />
}

function BellInner() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))
  const navigate = useNavigate()
  const { data: unread } = useUnreadCount(true)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotifications(open)
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()

  const items = data?.pages.flatMap(p => p.items) ?? []
  const count = unread?.count ?? 0

  const onItem = (n: NotificationView) => {
    if (!n.readAt) markRead.mutate(n.id)
    const link = notificationLink(n)
    setOpen(false)
    if (link) navigate(link)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title={m.notif_title()}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <FontAwesomeIcon icon={faBell} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <Card tone="base" padding="none" className="absolute bottom-0 left-14 z-50 flex max-h-[70vh] w-80 flex-col shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">{m.notif_title()}</span>
            {count > 0 && (
              <button onClick={() => markAll.mutate()} className="cursor-pointer text-xs text-muted-foreground transition hover:text-foreground">
                {m.notif_mark_all_read()}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <p className="px-4 py-6 text-center text-sm text-muted-foreground">{m.clan_loading()}</p>}
            {!isLoading && items.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">{m.notif_empty()}</p>}
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
          </div>
        </Card>
      )}
    </div>
  )
}

function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return m.notif_time_now()
  if (min < 60) return m.notif_time_min({ count: min })
  const h = Math.floor(min / 60)
  if (h < 24) return m.notif_time_hour({ count: h })
  return m.notif_time_day({ count: Math.floor(h / 24) })
}
