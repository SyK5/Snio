import { m } from '@/i18n/paraglide/messages'
import type { NotificationView } from './notification.types'

export function notificationText(n: NotificationView): string {
  const p = n.payload as Record<string, string>
  switch (n.type) {
    case 'CLAN_INVITE':
      return m.notif_clan_invite({ inviter: handle(p.invitedByName, p.invitedByDiscriminator), clan: p.clanName ?? '' })
    case 'CLAN_MEMBER_JOINED':
      return m.notif_clan_member_joined({ name: handle(p.displayName, p.discriminator), clan: p.clanName ?? '' })
    case 'CLAN_ROLE_CHANGED':
      return p.action === 'removed'
        ? m.notif_clan_role_removed({ clan: p.clanName ?? '', role: p.roleName ?? '' })
        : m.notif_clan_role_assigned({ clan: p.clanName ?? '', role: p.roleName ?? '' })
    case 'CLAN_KICKED':
      return m.notif_clan_kicked({ clan: p.clanName ?? '' })
    default:
      return ''
  }
}

export function notificationLink(n: NotificationView): string | null {
  const p = n.payload as Record<string, string>
  switch (n.type) {
    case 'CLAN_INVITE':
      return p.code ? `/invite/${p.code}` : null
    case 'CLAN_MEMBER_JOINED':
    case 'CLAN_ROLE_CHANGED':
      return p.clanId ? `/clans/${p.clanId}` : null
    default:
      return null
  }
}

function handle(name?: string, discriminator?: string): string {
  return discriminator ? `${name}#${discriminator}` : (name ?? '')
}
