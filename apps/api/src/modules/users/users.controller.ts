import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { AuthGuard } from '../../common/guards/auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthUser } from '../../common/auth/auth.types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { UsersService } from './users.service'
import { AvatarConfirmInput, AvatarPresignInput, AvatarPresignResponse, MeResponse, avatarConfirmSchema, avatarPresignSchema } from './users.dto'

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<MeResponse> {
    return this.users.toMeResponse(user)
  }

  @Post('me/avatar/presign')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  presignAvatar(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(avatarPresignSchema)) dto: AvatarPresignInput): Promise<AvatarPresignResponse> {
    return this.users.presignAvatar(user.id, dto.contentType)
  }

  @Post('me/avatar/confirm')
  confirmAvatar(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(avatarConfirmSchema)) dto: AvatarConfirmInput): Promise<MeResponse> {
    return this.users.confirmAvatar(user, dto.key)
  }

  @Delete('me/avatar')
  removeAvatar(@CurrentUser() user: AuthUser): Promise<MeResponse> {
    return this.users.removeAvatar(user)
  }
}
