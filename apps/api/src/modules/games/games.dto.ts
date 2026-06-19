import { z } from 'zod'

const ICON_TYPES = ['image/webp', 'image/jpeg', 'image/png'] as const
const TYPE_EXTENSIONS: Record<(typeof ICON_TYPES)[number], string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export const createGameSchema = z.object({
  name: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(60, 'Maximal 60 Zeichen'),
  iconKey: z.string().min(1).max(256).optional(),
})

export const updateGameSchema = z
  .object({
    name: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(60, 'Maximal 60 Zeichen').optional(),
    iconKey: z.string().min(1).max(256).nullable().optional(),
  })
  .refine(d => Object.keys(d).length > 0, 'Keine Änderungen übergeben')

export const gameIconPresignSchema = z.object({
  contentType: z.enum(ICON_TYPES),
})

export type CreateGameInput = z.infer<typeof createGameSchema>
export type UpdateGameInput = z.infer<typeof updateGameSchema>
export type GameIconPresignInput = z.infer<typeof gameIconPresignSchema>

export interface GameView {
  id: string
  slug: string
  name: string
  iconUrl: string | null
}

export interface GameIconPresignResponse {
  key: string
  url: string
  fields: Record<string, string>
  maxBytes: number
}

export { ICON_TYPES, TYPE_EXTENSIONS }
