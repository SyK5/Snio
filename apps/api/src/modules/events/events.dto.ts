import { z } from 'zod'
import { OrganizerView } from './organizer'

export const listEventsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const createEventSchema = z
  .object({
    gameId: z.string().min(1),
    title: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(120, 'Maximal 120 Zeichen'),
    description: z.string().trim().max(2000).nullable().optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PRIVATE'),
    registrationPolicy: z.enum(['OPEN', 'INVITE_ONLY', 'CLOSED']).default('INVITE_ONLY'),
    requiresApproval: z.boolean().default(false),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().nullable().optional(),
    registrationOpensAt: z.coerce.date().nullable().optional(),
    registrationClosesAt: z.coerce.date().nullable().optional(),
    location: z.string().trim().max(200).nullable().optional(),
    ruleset: z.string().trim().max(5000).nullable().optional(),
  })
  .refine(d => !d.endsAt || d.endsAt > d.startsAt, { message: 'Ende muss nach dem Start liegen', path: ['endsAt'] })
  .refine(d => !d.registrationOpensAt || !d.registrationClosesAt || d.registrationClosesAt > d.registrationOpensAt, {
    message: 'Anmeldeschluss muss nach dem Anmeldestart liegen',
    path: ['registrationClosesAt'],
  })

export type ListEventsQuery = z.infer<typeof listEventsSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(120, 'Maximal 120 Zeichen').optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    registrationPolicy: z.enum(['OPEN', 'INVITE_ONLY', 'CLOSED']).optional(),
    requiresApproval: z.boolean().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    registrationOpensAt: z.coerce.date().nullable().optional(),
    registrationClosesAt: z.coerce.date().nullable().optional(),
    location: z.string().trim().max(200).nullable().optional(),
    ruleset: z.string().trim().max(5000).nullable().optional(),
  })
  .refine(d => !d.startsAt || !d.endsAt || d.endsAt > d.startsAt, { message: 'Ende muss nach dem Start liegen', path: ['endsAt'] })
  .refine(d => !d.registrationOpensAt || !d.registrationClosesAt || d.registrationClosesAt > d.registrationOpensAt, {
    message: 'Anmeldeschluss muss nach dem Anmeldestart liegen',
    path: ['registrationClosesAt'],
  })

export type UpdateEventInput = z.infer<typeof updateEventSchema>

export interface EventGameView {
  id: string
  slug: string
  name: string
  iconUrl: string | null
}

export type EventVisibility = 'PUBLIC' | 'PRIVATE'
export type RegistrationPolicy = 'OPEN' | 'INVITE_ONLY' | 'CLOSED'
export type ParticipantType = 'SOLO' | 'TEAM'
export type ParticipationStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED'

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
  createdAt: string
}

export interface EventDetailView extends EventView {
  participants: ParticipantView[]
}

export interface EventPage {
  items: EventView[]
  nextCursor: string | null
}
