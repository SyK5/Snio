export type EventVisibility = 'PUBLIC' | 'PRIVATE'
export type RegistrationPolicy = 'OPEN' | 'INVITE_ONLY' | 'CLOSED'
export type ParticipantType = 'SOLO' | 'TEAM'
export type ParticipationStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED'
export type OrganizerKind = 'SYSTEM' | 'CLAN' | 'ORGANIZATION'

export interface OrganizerView {
  kind: OrganizerKind
  id: string | null
  name: string
  slug: string | null
  logoUrl: string | null
}

export interface EventGameView {
  id: string
  slug: string
  name: string
  iconUrl: string | null
}

export interface ParticipantView {
  id: string
  userId: string
  username: string
  displayName: string
  discriminator: string
  status: ParticipationStatus
  createdAt: string
}

export interface EventView {
  id: string
  organizer: OrganizerView
  game: EventGameView
  title: string
  description: string | null
  visibility: EventVisibility
  registrationPolicy: RegistrationPolicy
  participantType: ParticipantType
  requiresApproval: boolean
  startsAt: string
  endsAt: string | null
  registrationOpensAt: string | null
  registrationClosesAt: string | null
  location: string | null
  ruleset: string | null
  myStatus: ParticipationStatus | null
  canManage: boolean
  canInvite: boolean
  createdAt: string
}

export interface EventDetailView extends EventView {
  participants: ParticipantView[]
}

export interface EventPage {
  items: EventView[]
  nextCursor: string | null
}

export interface CreateEventPayload {
  gameId: string
  title: string
  description?: string | null
  visibility?: EventVisibility
  registrationPolicy?: RegistrationPolicy
  requiresApproval?: boolean
  startsAt: string
  endsAt?: string | null
  registrationOpensAt?: string | null
  registrationClosesAt?: string | null
  location?: string | null
  ruleset?: string | null
}

export interface UpdateEventPayload {
  title?: string
  description?: string | null
  visibility?: EventVisibility
  registrationPolicy?: RegistrationPolicy
  requiresApproval?: boolean
  startsAt?: string
  endsAt?: string | null
  registrationOpensAt?: string | null
  registrationClosesAt?: string | null
  location?: string | null
  ruleset?: string | null
}

export interface EventInviteTargetView {
  userId: string
  username: string
  displayName: string
  discriminator: string
}

export interface EventInviteView {
  id: string
  code: string
  target: EventInviteTargetView | null
  maxUses: number | null
  uses: number
  expiresAt: string | null
  createdAt: string
}

export interface EventInvitePreview {
  code: string
  eventId: string
  title: string
  targeted: boolean
}

export interface CreateEventLinkPayload {
  maxUses?: number | null
  expiresAt?: string | null
}

export interface CreateEventTargetedPayload {
  username: string
  discriminator: string
}
