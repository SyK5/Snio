import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'
import { useNotificationPreferences, useSetPreference } from './notification.hooks'
import type { NotificationType } from './notification.types'

export function NotificationPreferences() {
  const { data: prefs, isLoading } = useNotificationPreferences()
  const set = useSetPreference()
  if (isLoading || !prefs) return null

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">{m.notif_settings_title()}</h2>
      <div className="flex flex-col divide-y divide-border">
        {prefs.map(p => (
          <div key={p.type} className="flex items-center justify-between py-3">
            <span className="text-sm text-foreground">{prefLabel(p.type)}</span>
            <Toggle checked={p.enabled} onChange={enabled => set.mutate({ type: p.type, enabled })} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition', checked ? 'bg-primary' : 'border border-border bg-surface-muted')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all', checked ? 'left-[1.375rem]' : 'left-0.5')} />
    </button>
  )
}

function prefLabel(type: NotificationType): string {
  switch (type) {
    case 'CLAN_INVITE':
      return m.notif_pref_clan_invite()
    case 'CLAN_MEMBER_JOINED':
      return m.notif_pref_clan_member_joined()
    case 'CLAN_ROLE_CHANGED':
      return m.notif_pref_clan_role_changed()
    case 'CLAN_KICKED':
      return m.notif_pref_clan_kicked()
  }
}
