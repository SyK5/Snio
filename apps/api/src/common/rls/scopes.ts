export type RlsScope = 'context-free' | 'clan' | 'self' | 'deferred'

export interface ModelScope {
  scope: RlsScope
  field?: string
}

export const MODEL_SCOPES: Record<string, ModelScope> = {
  User: { scope: 'context-free' },
  Session: { scope: 'context-free' },
  RefreshToken: { scope: 'context-free' },
  EmailVerificationToken: { scope: 'context-free' },
  PasswordResetToken: { scope: 'context-free' },
  Game: { scope: 'context-free' },

  Clan: { scope: 'clan', field: 'id' },
  ClanMember: { scope: 'clan', field: 'clan_id' },
  ClanRoleDef: { scope: 'clan', field: 'clan_id' },
  ClanRoleGrant: { scope: 'clan', field: 'role.clan_id' },
  ClanMemberRole: { scope: 'clan', field: 'member.clan_id' },
  ClanGame: { scope: 'clan', field: 'clan_id' },
  Event: { scope: 'clan', field: 'clan_id' },
  EventParticipation: { scope: 'clan', field: 'event.clan_id' },
  Training: { scope: 'clan', field: 'clan_id' },
  TrainingParticipation: { scope: 'clan', field: 'training.clan_id' },
  CustomEmoji: { scope: 'clan', field: 'clan_id' },

  Notification: { scope: 'self', field: 'user_id' },
  UserDevice: { scope: 'self', field: 'user_id' },

  League: { scope: 'deferred' },
  LeagueParticipant: { scope: 'deferred' },
  LeagueRoster: { scope: 'deferred' },
  ChatChannel: { scope: 'deferred' },
  ChatChannelMember: { scope: 'deferred' },
  ChatMessage: { scope: 'deferred' },
  ChatMessageAttachment: { scope: 'deferred' },
  ChatMessageReaction: { scope: 'deferred' },
  ChatMessageMention: { scope: 'deferred' },
  ChatMessageEmbed: { scope: 'deferred' },
  ChatMessageEdit: { scope: 'deferred' },
  Sticker: { scope: 'deferred' },
  CallSession: { scope: 'deferred' },
  CallParticipant: { scope: 'deferred' },
  Document: { scope: 'deferred' },
  AuditLog: { scope: 'deferred' },
}

export function modelScope(model: string): ModelScope | null {
  return MODEL_SCOPES[model] ?? null
}
