import { m } from '@/i18n/paraglide/messages'

export const ACTION = { READ: 1, CREATE: 2, UPDATE: 4, DELETE: 8, MANAGE: 16 } as const

export const ACTIONS: { bit: number; label: () => string }[] = [
  { bit: ACTION.READ, label: m.grant_action_read },
  { bit: ACTION.CREATE, label: m.grant_action_create },
  { bit: ACTION.UPDATE, label: m.grant_action_update },
  { bit: ACTION.DELETE, label: m.grant_action_delete },
  { bit: ACTION.MANAGE, label: m.grant_action_manage },
]

export const ROLE_COLORS = ['#e11d48', '#f97316', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

export const CATEGORY_ORDER = ['clan', 'members', 'roles', 'games', 'events', 'trainings', 'leagues', 'chat', 'documents', 'moderation']

const GRANT_LABELS: Record<string, () => string> = {
  clan: m.grant_clan,
  clan_member: m.grant_clan_member,
  clan_role: m.grant_clan_role,
  clan_invite: m.grant_clan_invite,
  clan_game: m.grant_clan_game,
  event: m.grant_event,
  event_participation: m.grant_event_participation,
  training: m.grant_training,
  training_participation: m.grant_training_participation,
  league: m.grant_league,
  league_roster: m.grant_league_roster,
  chat_channel: m.grant_chat_channel,
  chat_message: m.grant_chat_message,
  chat_emoji: m.grant_chat_emoji,
  chat_sticker: m.grant_chat_sticker,
  chat_call: m.grant_chat_call,
  document: m.grant_document,
  audit_log: m.grant_audit_log,
}

const CATEGORY_LABELS: Record<string, () => string> = {
  clan: m.grant_cat_clan,
  members: m.grant_cat_members,
  roles: m.grant_cat_roles,
  games: m.grant_cat_games,
  events: m.grant_cat_events,
  trainings: m.grant_cat_trainings,
  leagues: m.grant_cat_leagues,
  chat: m.grant_cat_chat,
  documents: m.grant_cat_documents,
  moderation: m.grant_cat_moderation,
}

export const grantLabel = (key: string): string => (GRANT_LABELS[key] ?? (() => key))()
export const categoryLabel = (key: string): string => (CATEGORY_LABELS[key] ?? (() => key))()
