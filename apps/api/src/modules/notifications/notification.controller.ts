import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '../../common/guards/auth.guard'
import { PendingFieldsGuard } from '../../common/guards/pending-fields.guard'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { NotificationService } from './notification.service'
import {
  ListNotificationsQuery,
  NOTIFIABLE_TYPES,
  NotifiableType,
  NotificationPage,
  NotificationPreferenceView,
  SetPreferenceInput,
  listNotificationsSchema,
  setPreferenceSchema,
} from './notification.dto'

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard, PendingFieldsGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listNotificationsSchema)) q: ListNotificationsQuery): Promise<NotificationPage> {
    return this.notifications.list(q.cursor, q.limit)
  }

  @Get('unread-count')
  async unreadCount(): Promise<{ count: number }> {
    return { count: await this.notifications.unreadCount() }
  }

  @Get('preferences')
  preferences(): Promise<NotificationPreferenceView[]> {
    return this.notifications.preferences()
  }

  @Post('read-all')
  @HttpCode(204)
  markAllRead(): Promise<void> {
    return this.notifications.markAllRead()
  }

  @Post(':id/read')
  @HttpCode(204)
  markRead(@Param('id') id: string): Promise<void> {
    return this.notifications.markRead(id)
  }

  @Put('preferences/:type')
  setPreference(@Param('type') type: string, @Body(new ZodValidationPipe(setPreferenceSchema)) dto: SetPreferenceInput): Promise<NotificationPreferenceView> {
    if (!NOTIFIABLE_TYPES.includes(type as NotifiableType))
      throw new BadRequestException({ code: 'NOTIFICATION_TYPE_INVALID', message: 'Unbekannter Benachrichtigungstyp' })
    return this.notifications.setPreference(type as NotifiableType, dto.enabled)
  }
}
