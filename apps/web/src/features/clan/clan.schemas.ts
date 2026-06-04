import { z } from 'zod'

export const tagField = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.string().regex(/^[A-Z0-9]{2,8}$/, 'Tag: 2 bis 8 Zeichen, nur A-Z und 0-9'))

export const createClanSchema = z.object({
  name: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(40, 'Maximal 40 Zeichen'),
  tag: tagField,
  description: z.string().trim().max(500, 'Maximal 500 Zeichen').optional(),
})

export const updateClanSchema = z.object({
  name: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(40, 'Maximal 40 Zeichen'),
  tag: tagField,
  description: z.string().trim().max(500, 'Maximal 500 Zeichen'),
})

export type CreateClanForm = z.infer<typeof createClanSchema>
export type UpdateClanForm = z.infer<typeof updateClanSchema>
