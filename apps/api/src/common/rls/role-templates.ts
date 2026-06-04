import { Action, combine } from './actions'
import { GrantKey } from './grants.catalog'

export const SYSTEM_ROLES = [
  { key: 'owner', name: 'Owner', color: '#e11d48', position: 3 },
  { key: 'leader', name: 'Leader', color: '#f59e0b', position: 2 },
  { key: 'trainer', name: 'Trainer', color: '#3b82f6', position: 1 },
  { key: 'member', name: 'Member', color: null, position: 0 },
] as const

export type SystemRoleKey = (typeof SYSTEM_ROLES)[number]['key']
export type DefaultRoleKey = Exclude<SystemRoleKey, 'owner'>

const { READ: R, CREATE: C, UPDATE: U, DELETE: D, MANAGE: M } = Action

export const ROLE_GRANT_DEFAULTS: Record<DefaultRoleKey, Partial<Record<GrantKey, number>>> = {
  leader: {
    clan: combine(R, U, M),
    clan_member: combine(R, C, U, D, M),
    clan_role: combine(R, C, U, D, M),
    clan_invite: combine(R, C, D),
    clan_game: combine(R, C, D, M),
    event: combine(R, C, U, D, M),
    event_participation: combine(R, C, U, D),
    training: combine(R, C, U, D, M),
    training_participation: combine(R, C, U, D),
    league: combine(R, C, U, D, M),
    league_roster: combine(R, C, U, D),
    chat_channel: combine(R, C, U, D, M),
    chat_message: combine(R, C, U, D, M),
    chat_emoji: combine(R, C, D, M),
    chat_sticker: combine(R, C, D, M),
    chat_call: combine(R, C),
    document: combine(R, C, D, M),
    audit_log: R,
  },
  trainer: {
    clan: R,
    clan_member: R,
    clan_game: R,
    event: combine(R, C, U, D),
    event_participation: combine(R, C, U, D),
    training: combine(R, C, U, D),
    training_participation: combine(R, C, U, D),
    chat_channel: combine(R, C),
    chat_message: combine(R, C),
  },
  member: {
    clan: R,
    clan_member: R,
    event: R,
    event_participation: combine(R, C, U),
    training: R,
    training_participation: combine(R, C, U),
    chat_message: combine(R, C),
    chat_emoji: R,
    chat_sticker: R,
  },
}

export function grantRows(grants: Partial<Record<GrantKey, number>>): { grant: string; actions: number }[] {
  return Object.entries(grants).map(([grant, actions]) => ({ grant, actions: actions ?? 0 }))
}
