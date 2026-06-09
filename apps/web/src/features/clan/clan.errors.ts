import { isAxiosError } from 'axios'
import { m } from '@/i18n/paraglide/messages'

const MESSAGES: Record<string, () => string> = {
  CLAN_TAG_TAKEN: m.clan_error_tag_taken,
  CLAN_CREATE_FAILED: m.clan_error_create_failed,
  CLAN_NOT_FOUND: m.clan_not_found,
  CLAN_ALREADY_MEMBER: m.clan_error_already_member,
  CLAN_OWNER_CANNOT_LEAVE: m.clan_error_owner_cannot_leave,
  CLAN_NO_MEMBERSHIP: m.clan_error_no_membership,
  CLAN_OWNER_CANNOT_BE_KICKED: m.clan_error_owner_cannot_be_kicked,
  CLAN_MEMBER_NOT_FOUND: m.clan_error_member_not_found,
  CLAN_ROLE_NOT_FOUND: m.clan_error_role_not_found,
  CLAN_TARGET_ROLE_TOO_HIGH: m.clan_error_target_role_too_high,
  CLAN_OWNER_ROLE_NOT_ASSIGNABLE: m.clan_error_owner_role_not_assignable,
  CLAN_OWNER_ROLE_NOT_REMOVABLE: m.clan_error_owner_role_not_removable,
  CLAN_ROLE_ABOVE_OWN_POSITION: m.clan_error_role_above_own_position,
  CLAN_SYSTEM_ROLE_NOT_RENAMABLE: m.clan_error_system_role_not_renamable,
  CLAN_SYSTEM_ROLE_NOT_DELETABLE: m.clan_error_system_role_not_deletable,
  CLAN_OWNER_ROLE_NOT_EDITABLE: m.clan_error_owner_role_not_editable,
  CLAN_GRANT_UNKNOWN: m.clan_error_grant_unknown,
  CLAN_GRANT_ESCALATION: m.clan_error_grant_escalation,
  CLAN_ROLE_REORDER_INVALID: m.clan_error_role_reorder_invalid,
}

export function resolveClanError(error: unknown): string {
  if (isAxiosError(error)) {
    const code = error.response?.data?.code
    if (typeof code === 'string' && MESSAGES[code]) return MESSAGES[code]()
  }
  return m.clan_error_generic()
}
