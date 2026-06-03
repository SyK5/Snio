import { Action } from './actions'

export type GrantScope = 'clan'

export interface GrantMeta {
  label: string
  category: string
  scope: GrantScope
  actions: number
}

export const GRANT_CATALOG = {
  clan: { label: 'Clan Einstellungen', category: 'clan', scope: 'clan', actions: Action.READ | Action.UPDATE | Action.DELETE | Action.MANAGE },
  clan_member: { label: 'Mitglieder', category: 'members', scope: 'clan', actions: Action.READ | Action.CREATE | Action.UPDATE | Action.DELETE | Action.MANAGE },
  clan_role: { label: 'Rollen', category: 'roles', scope: 'clan', actions: Action.READ | Action.CREATE | Action.UPDATE | Action.DELETE | Action.MANAGE },
  clan_invite: { label: 'Einladungen', category: 'members', scope: 'clan', actions: Action.READ | Action.CREATE | Action.DELETE },
  clan_game: { label: 'Spiele Zuordnung', category: 'games', scope: 'clan', actions: Action.READ | Action.CREATE | Action.DELETE | Action.MANAGE },
  event: { label: 'Events', category: 'events', scope: 'clan', actions: Action.READ | Action.CREATE | Action.UPDATE | Action.DELETE | Action.MANAGE },
  event_participation: { label: 'Event Teilnahmen', category: 'events', scope: 'clan', actions: Action.READ | Action.CREATE | Action.UPDATE | Action.DELETE },
  training: { label: 'Trainings', category: 'trainings', scope: 'clan', actions: Action.READ | Action.CREATE | Action.UPDATE | Action.DELETE | Action.MANAGE },
  training_participation: { label: 'Training Teilnahmen', category: 'trainings', scope: 'clan', actions: Action.READ | Action.CREATE | Action.UPDATE | Action.DELETE },
  league: { label: 'Leagues', category: 'leagues', scope: 'clan', actions: Action.READ | Action.CREATE | Action.UPDATE | Action.DELETE | Action.MANAGE },
  league_roster: { label: 'League Roster', category: 'leagues', scope: 'clan', actions: Action.READ | Action.CREATE | Action.UPDATE | Action.DELETE },
  chat_channel: { label: 'Channels', category: 'chat', scope: 'clan', actions: Action.READ | Action.CREATE | Action.UPDATE | Action.DELETE | Action.MANAGE },
  chat_message: { label: 'Nachrichten', category: 'chat', scope: 'clan', actions: Action.READ | Action.CREATE | Action.UPDATE | Action.DELETE | Action.MANAGE },
  chat_emoji: { label: 'Custom Emojis', category: 'chat', scope: 'clan', actions: Action.READ | Action.CREATE | Action.DELETE | Action.MANAGE },
  chat_sticker: { label: 'Sticker', category: 'chat', scope: 'clan', actions: Action.READ | Action.CREATE | Action.DELETE | Action.MANAGE },
  chat_call: { label: 'Anrufe', category: 'chat', scope: 'clan', actions: Action.READ | Action.CREATE },
  document: { label: 'Dokumente', category: 'documents', scope: 'clan', actions: Action.READ | Action.CREATE | Action.DELETE | Action.MANAGE },
  audit_log: { label: 'Audit Log', category: 'moderation', scope: 'clan', actions: Action.READ },
} as const satisfies Record<string, GrantMeta>

export type GrantKey = keyof typeof GRANT_CATALOG

export const RETIRED_GRANTS: ReadonlySet<string> = new Set([])

export function isKnownGrant(key: string): key is GrantKey {
  return key in GRANT_CATALOG
}

export function grantMeta(key: string): GrantMeta | null {
  return isKnownGrant(key) ? GRANT_CATALOG[key] : null
}

export function grantActions(key: string): number {
  return isKnownGrant(key) ? GRANT_CATALOG[key].actions : 0
}

export function validateCatalog(): void {
  for (const key of Object.keys(GRANT_CATALOG)) {
    if (RETIRED_GRANTS.has(key)) throw new Error(`Grant Key "${key}" ist retired und darf nicht wiederverwendet werden`)
  }
}
