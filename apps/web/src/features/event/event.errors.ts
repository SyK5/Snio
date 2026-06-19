import { isAxiosError } from 'axios'
import { m } from '@/i18n/paraglide/messages'

const MESSAGES: Record<string, () => string> = {
  EVENT_NOT_FOUND: m.event_error_not_found,
  EVENT_GAME_NOT_FOUND: m.event_error_game_not_found,
  EVENT_ORG_NOT_FOUND: m.event_error_org_not_found,
  EVENT_NOT_ORG_OWNER: m.event_error_not_org_owner,
  EVENT_NOT_PLATFORM_ADMIN: m.event_error_not_platform_admin,
  EVENT_TEAM_NOT_SUPPORTED: m.event_error_team_not_supported,
  EVENT_REGISTRATION_CLOSED: m.event_error_registration_closed,
  EVENT_INVITE_ONLY: m.event_error_invite_only,
  EVENT_REGISTRATION_NOT_OPEN: m.event_error_registration_not_open,
  EVENT_REGISTRATION_WINDOW_CLOSED: m.event_error_registration_window_closed,
  EVENT_ALREADY_REGISTERED: m.event_error_already_registered,
  EVENT_NOT_REGISTERED: m.event_error_not_registered,
  EVENT_PARTICIPATION_NOT_FOUND: m.event_error_participation_not_found,
  EVENT_INVITE_NOT_FOUND: m.event_invite_error_not_found,
  EVENT_INVITE_REVOKED: m.event_invite_error_revoked,
  EVENT_INVITE_EXPIRED: m.event_invite_error_expired,
  EVENT_INVITE_EXHAUSTED: m.event_invite_error_exhausted,
  EVENT_INVITE_NOT_FOR_YOU: m.event_invite_error_not_for_you,
  EVENT_INVITE_USER_NOT_FOUND: m.event_invite_error_user_not_found,
  EVENT_INVITE_ALREADY_INVITED: m.event_invite_error_already_invited,
  EVENT_INVITE_CREATE_FAILED: m.event_invite_error_create_failed,
}

export function resolveEventError(error: unknown): string {
  if (isAxiosError(error)) {
    const code = error.response?.data?.code
    if (typeof code === 'string' && MESSAGES[code]) return MESSAGES[code]()
  }
  return m.event_error_generic()
}
