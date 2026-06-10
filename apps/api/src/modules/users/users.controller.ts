import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { AuthGuard } from '../../common/guards/auth.guard'
import { PendingFieldsGuard } from '../../common/guards/pending-fields.guard'
import { AllowPending } from '../../common/decorators/allow-pending.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthUser } from '../../common/auth/auth.types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { UsersService } from './users.service'
import {
  AvatarConfirmInput,
  AvatarPresignInput,
  AvatarPresignResponse,
  MeResponse,
  UpdateProfileInput,
  UpdateUsernameInput,
  avatarConfirmSchema,
  avatarPresignSchema,
  updateProfileSchema,
  updateUsernameSchema,
} from './users.dto'

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard, PendingFieldsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @AllowPending()
  me(@CurrentUser() user: AuthUser): Promise<MeResponse> {
    return this.users.toMeResponse(user)
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileInput): Promise<MeResponse> {
    return this.users.updateProfile(user, dto)
  }

  @Patch('me/username')
  @AllowPending()
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  updateUsername(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(updateUsernameSchema)) dto: UpdateUsernameInput): Promise<MeResponse> {
    return this.users.updateUsername(user, dto)
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
