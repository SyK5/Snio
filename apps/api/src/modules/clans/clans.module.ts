import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ClansController } from './clans.controller'
import { ClansService } from './clans.service'

@Module({
  imports: [AuthModule],
  controllers: [ClansController],
  providers: [ClansService],
  exports: [ClansService],
})
export class ClansModule {}
