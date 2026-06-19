import { isAxiosError } from 'axios'
import { m } from '@/i18n/paraglide/messages'

const MESSAGES: Record<string, () => string> = {
  GAME_NOT_PLATFORM_ADMIN: m.game_error_not_platform_admin,
  GAME_NOT_FOUND: m.game_error_not_found,
  GAME_CREATE_FAILED: m.game_error_create_failed,
  GAME_ICON_KEY_INVALID: m.game_error_icon_key_invalid,
}

export function resolveGameError(error: unknown): string {
  if (isAxiosError(error)) {
    const code = error.response?.data?.code
    if (typeof code === 'string' && MESSAGES[code]) return MESSAGES[code]()
  }
  return m.game_error_generic()
}
