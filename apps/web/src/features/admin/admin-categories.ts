import { faGamepad } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { m } from '@/i18n/paraglide/messages'

export interface AdminCategory {
  key: string
  path: string
  icon: IconDefinition
  label: () => string
}

export const ADMIN_CATEGORIES: AdminCategory[] = [{ key: 'games', path: '/admin/games', icon: faGamepad, label: () => m.admin_games_title() }]
