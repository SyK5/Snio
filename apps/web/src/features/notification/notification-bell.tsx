import { useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faCircleDot, faEnvelope, faInbox, faShield, faUsers } from '@fortawesome/free-solid-svg-icons'
import { Card } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth/auth.store'
import { useClickOutside } from '@/hooks/use-click-outside'
import { m } from '@/i18n/paraglide/messages'
import { useMarkAllRead, useUnreadCount } from './notification.hooks'
import { NotificationList } from './notification-list'

type Filter = 'all' | 'invite' | 'member' | 'role'

export function NotificationBell() {
  const accessToken = useAuthStore(s => s.accessToken)
  if (!accessToken) return null
  return <BellInner />
}

function BellInner() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Filter>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))
  const { data: unread } = useUnreadCount(true)
  const markAll = useMarkAllRead()
  const count = unread?.count ?? 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title={m.notif_title()}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-nav-1-fg transition hover:bg-nav-1-muted hover:text-nav-1-fg-strong"
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
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
            <Segmented
              value={category}
              onChange={setCategory}
              options={[
                { value: 'all', icon: faInbox, title: m.notif_filter_all() },
                { value: 'invite', icon: faEnvelope, title: m.notif_filter_invites() },
                { value: 'member', icon: faUsers, title: m.notif_filter_members() },
                { value: 'role', icon: faShield, title: m.notif_filter_roles() },
              ]}
            />
            <button
              onClick={() => setUnreadOnly(v => !v)}
              title={m.notif_filter_unread()}
              className={cn(
                'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sm transition',
                unreadOnly ? 'bg-primary text-primary-foreground' : 'border border-border bg-surface-muted text-muted-foreground hover:text-foreground',
              )}
            >
              <FontAwesomeIcon icon={faCircleDot} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <NotificationList enabled={open} category={category === 'all' ? undefined : category} unreadOnly={unreadOnly} onClose={() => setOpen(false)} />
          </div>
        </Card>
      )}
    </div>
  )
}
