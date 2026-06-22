import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { NotificationType, Prisma } from '@prisma/client'
import { RLS_PRISMA, RlsPrismaClient } from '../../common/prisma/prisma.extended'
import { cursorPage } from '../../common/prisma/cursor-page'
import { currentUserId, requestContext } from '../../common/context/request-context'
import {
  NOTIFIABLE_TYPES,
  NOTIFICATION_CATEGORIES,
  NotifiableType,
  NotificationCategory,
  NotificationPage,
  NotificationPreferenceView,
  NotificationView,
} from './notification.dto'

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  constructor(@Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient) {}

  async emit(userId: string, type: NotificationType, payload: Prisma.InputJsonValue): Promise<void> {
    void requestContext
      .run({ requestId: 'notif', system: true }, async () => {
        const pref = await this.prisma.notificationPreference.findFirst({ where: { user_id: userId, type } })
        if (pref && !pref.enabled) return
        await this.prisma.notification.create({ data: { user_id: userId, type, payload } })
      })
      .catch(() => this.logger.warn(`notification emit failed: ${type} -> ${userId}`))
  }

  async list(cursor: string | undefined, limit: number, category?: NotificationCategory, unreadOnly?: boolean): Promise<NotificationPage> {
    const types = category ? NOTIFICATION_CATEGORIES[category] : undefined
    return cursorPage(
      limit,
      take =>
        this.prisma.notification.findMany({
          where: { ...(types ? { type: { in: [...types] } } : {}), ...(unreadOnly ? { read_at: null } : {}) },
          orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
          take,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      toView,
    )
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
