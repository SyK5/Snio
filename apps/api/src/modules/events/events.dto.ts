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
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().nullable().optional(),
    location: z.string().trim().max(200).nullable().optional(),
    ruleset: z.string().trim().max(5000).nullable().optional(),
  })
  .refine(d => !d.endsAt || d.endsAt > d.startsAt, { message: 'Ende muss nach dem Start liegen', path: ['endsAt'] })

export type ListEventsQuery = z.infer<typeof listEventsSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>

export interface EventGameView {
  id: string
  slug: string
  name: string
  iconUrl: string | null
}

export interface EventView {
  id: string
  organizer: OrganizerView
  game: EventGameView
  title: string
  description: string | null
  startsAt: string
  endsAt: string | null
  location: string | null
  ruleset: string | null
  createdAt: string
}

export interface EventPage {
  items: EventView[]
  nextCursor: string | null
}
