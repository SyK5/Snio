import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { NotificationModule } from '../notifications/notification.module'
import { EventsController } from './events.controller'
import { EventsService } from './events.service'
import { EventInviteController } from './event-invite.controller'
import { EventInviteService } from './event-invite.service'

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [EventsController, EventInviteController],
  providers: [EventsService, EventInviteService],
  exports: [EventsService],
})
export class EventsModule {}
