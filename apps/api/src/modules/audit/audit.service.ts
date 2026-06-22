import { Inject, Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { RLS_PRISMA, RlsPrismaClient } from '../../common/prisma/prisma.extended'
import { currentStore, requestContext, runSystem } from '../../common/context/request-context'
import { AuditActionKey, AuditEntityType } from './audit-actions'
import { AuditLogPage, AuditLogView } from './audit.dto'
import { cursorPage } from '../../common/prisma/cursor-page'

const ACTOR_SELECT = { id: true, username: true, display_name: true, discriminator: true } satisfies Prisma.UserSelect

interface WriteInput {
  clanId: string
  action: AuditActionKey
  entityType: AuditEntityType
  entityId?: string | null
  metadata?: Prisma.InputJsonValue
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(@Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient) {}

  async write(input: WriteInput): Promise<void> {
    const actorId = currentStore()?.userId ?? null
    void requestContext
      .run({ requestId: 'audit', system: true }, () =>
        this.prisma.auditLog.create({
          data: {
            clan_id: input.clanId,
            actor_id: actorId,
            action: input.action,
            entity_type: input.entityType,
            entity_id: input.entityId ?? null,
            metadata: input.metadata ?? Prisma.JsonNull,
          },
        }),
      )
      .catch(() => this.logger.warn(`audit write failed: ${input.action} @ ${input.clanId}`))
  }

  async list(clanId: string, cursor: string | undefined, limit: number, category?: string): Promise<AuditLogPage> {
    return runSystem(() =>
      cursorPage(
        limit,
        take =>
          this.prisma.auditLog.findMany({
            where: { clan_id: clanId, ...(category ? { action: { startsWith: `${category}.` } } : {}) },
            include: { actor: { select: ACTOR_SELECT } },
            orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
            take,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          }),
        toView,
      ),
    )
  }
}

type AuditRow = Prisma.AuditLogGetPayload<{ include: { actor: { select: typeof ACTOR_SELECT } } }>

function toView(row: AuditRow): AuditLogView {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    actor: row.actor ? { userId: row.actor.id, username: row.actor.username, displayName: row.actor.display_name, discriminator: row.actor.discriminator } : null,
    createdAt: row.created_at.toISOString(),
  }
}
