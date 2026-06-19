import { m } from '@/i18n/paraglide/messages'
import type { EventVisibility, ParticipationStatus, RegistrationPolicy } from './event.types'

export const statusLabel: Record<ParticipationStatus, () => string> = {
  PENDING: m.event_status_pending,
  CONFIRMED: m.event_status_confirmed,
  DECLINED: m.event_status_declined,
}

export const visibilityLabel: Record<EventVisibility, () => string> = {
  PUBLIC: m.event_visibility_public,
  PRIVATE: m.event_visibility_private,
}

export const policyLabel: Record<RegistrationPolicy, () => string> = {
  OPEN: m.event_policy_open,
  INVITE_ONLY: m.event_policy_invite_only,
  CLOSED: m.event_policy_closed,
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
