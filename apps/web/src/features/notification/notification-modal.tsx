import { useState } from 'react'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { PagedModal, type PagedModalTab } from '@/components/ui/paged-modal'
import { ScrollHints } from '@/components/ui/scroll-hints'
import { m } from '@/i18n/paraglide/messages'
import { useMarkAllRead, useUnreadCount } from './notification.hooks'
import { NotificationList } from './notification-list'

interface Props {
  open: boolean
  onClose: () => void
  tabs?: PagedModalTab[]
}

export function NotificationModal({ open, onClose, tabs }: Props) {
  const [category, setCategory] = useState('all')
  const markAll = useMarkAllRead()
  const { data: unread } = useUnreadCount(open)
  const count = unread?.count ?? 0

  return (
    <PagedModal
      open={open}
      onClose={onClose}
      icon={faBell}
      title={m.notif_title()}
      size="lg"
      bodyClassName="p-0 scrollbar-hide"
      tabs={tabs}
      activeTab={category}
      onTabChange={setCategory}
      actions={
        count > 0 ? (
          <button onClick={() => markAll.mutate()} className="cursor-pointer rounded-lg px-2 text-xs text-muted-foreground transition hover:text-foreground">
            {m.notif_mark_all_read()}
          </button>
        ) : undefined
      }
    >
      <ScrollHints className="max-h-[60vh] overflow-y-auto scrollbar-hide">
        <NotificationList enabled={open} category={tabs ? category : undefined} onClose={onClose} />
      </ScrollHints>
    </PagedModal>
  )
}
