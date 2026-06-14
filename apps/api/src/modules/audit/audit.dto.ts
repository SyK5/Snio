import { z } from 'zod'

export const auditLogQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  category: z.enum(['clan', 'member', 'role', 'invite']).optional(),
})

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>

export interface AuditActorView {
  userId: string
  username: string
  displayName: string
  discriminator: string
}

export interface AuditLogView {
  id: string
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown>
  actor: AuditActorView | null
  createdAt: string
}

export interface AuditLogPage {
  items: AuditLogView[]
  nextCursor: string | null
}
