import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { NotificationModule } from '../notifications/notification.module'
import { AuditModule } from '../audit/audit.module'
import { ClansController } from './clans.controller'
import { ClansService } from './clans.service'
import { InviteController } from './invite.controller'
import { InviteService } from './invite.service'

@Module({
  imports: [AuthModule, NotificationModule, AuditModule],
  controllers: [ClansController, InviteController],
  providers: [ClansService, InviteService],
  exports: [ClansService],
})
export class ClansModule {}
