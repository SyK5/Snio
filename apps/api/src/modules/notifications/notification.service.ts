import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { NotificationType, Prisma } from '@prisma/client'
import { RLS_PRISMA, RlsPrismaClient } from '../../common/prisma/prisma.extended'
import { currentUserId, runSystem } from '../../common/context/request-context'
import { NOTIFIABLE_TYPES, NotifiableType, NotificationPage, NotificationPreferenceView, NotificationView } from './notification.dto'

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  constructor(@Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient) {}

  async emit(userId: string, type: NotificationType, payload: Prisma.InputJsonValue): Promise<void> {
    try {
      await runSystem(async () => {
        const pref = await this.prisma.notificationPreference.findFirst({ where: { user_id: userId, type } })
        if (pref && !pref.enabled) return
        await this.prisma.notification.create({ data: { user_id: userId, type, payload } })
      })
    } catch {
      this.logger.warn(`notification emit failed: ${type} -> ${userId}`)
    }
  }

  async list(cursor: string | undefined, limit: number): Promise<NotificationPage> {
    const rows = await this.prisma.notification.findMany({
      orderBy: { created_at: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    const hasMore = rows.length > limit
    const items = rows.slice(0, limit).map(toView)
    return { items, nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null }
  }

  async unreadCount(): Promise<number> {
    return this.prisma.notification.count({ where: { read_at: null } })
  }

  async markRead(id: string): Promise<void> {
    const res = await this.prisma.notification.updateMany({ where: { id, read_at: null }, data: { read_at: new Date() } })
    if (res.count > 0) return
    const exists = await this.prisma.notification.findFirst({ where: { id } })
    if (!exists) throw new NotFoundException({ code: 'NOTIFICATION_NOT_FOUND', message: 'Benachrichtigung nicht gefunden' })
  }

  async markAllRead(): Promise<void> {
    await this.prisma.notification.updateMany({ where: { read_at: null }, data: { read_at: new Date() } })
  }

  async preferences(): Promise<NotificationPreferenceView[]> {
    const rows = await this.prisma.notificationPreference.findMany({ where: { type: { in: [...NOTIFIABLE_TYPES] } } })
    const map = new Map(rows.map(r => [r.type, r.enabled]))
    return NOTIFIABLE_TYPES.map(type => ({ type, enabled: map.get(type) ?? true }))
  }

  async setPreference(type: NotifiableType, enabled: boolean): Promise<NotificationPreferenceView> {
    const existing = await this.prisma.notificationPreference.findFirst({ where: { type } })
    if (existing) await this.prisma.notificationPreference.updateMany({ where: { type }, data: { enabled } })
    else await this.prisma.notificationPreference.create({ data: { user_id: currentUserId()!, type, enabled } })
    return { type, enabled }
  }
}

function toView(n: { id: string; type: NotificationType; payload: Prisma.JsonValue; read_at: Date | null; created_at: Date }): NotificationView {
  return {
    id: n.id,
    type: n.type,
    payload: (n.payload ?? {}) as Record<string, unknown>,
    readAt: n.read_at?.toISOString() ?? null,
    createdAt: n.created_at.toISOString(),
  }
}
