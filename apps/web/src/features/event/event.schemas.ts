import { z } from 'zod'

export const createEventForm = z
  .object({
    clanId: z.string().min(1, 'Clan wählen'),
    gameId: z.string().min(1, 'Spiel wählen'),
    title: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(120, 'Maximal 120 Zeichen'),
    description: z.string().trim().max(2000, 'Maximal 2000 Zeichen').optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']),
    registrationPolicy: z.enum(['OPEN', 'INVITE_ONLY', 'CLOSED']),
    requiresApproval: z.boolean(),
    startsAt: z.string().min(1, 'Startzeit wählen'),
    endsAt: z.string().optional(),
    registrationOpensAt: z.string().optional(),
    registrationClosesAt: z.string().optional(),
    location: z.string().trim().max(200, 'Maximal 200 Zeichen').optional(),
    ruleset: z.string().trim().max(5000, 'Maximal 5000 Zeichen').optional(),
  })
  .refine(d => !d.endsAt || new Date(d.endsAt) > new Date(d.startsAt), { message: 'Ende muss nach dem Start liegen', path: ['endsAt'] })
  .refine(d => !d.registrationOpensAt || !d.registrationClosesAt || new Date(d.registrationClosesAt) > new Date(d.registrationOpensAt), {
    message: 'Anmeldeschluss muss nach dem Anmeldestart liegen',
    path: ['registrationClosesAt'],
  })

export type CreateEventForm = z.infer<typeof createEventForm>
