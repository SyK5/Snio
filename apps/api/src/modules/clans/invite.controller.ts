import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '../../common/guards/auth.guard'
import { PendingFieldsGuard } from '../../common/guards/pending-fields.guard'
import { ClanContextGuard } from '../../common/rls/clan-context.guard'
import { PermissionGuard } from '../../common/rls/permission.guard'
import { RequireGrant } from '../../common/rls/require-grant.decorator'
import { Action } from '../../common/rls/actions'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthUser } from '../../common/auth/auth.types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { ClanDetail } from './clans.dto'
import { InviteService } from './invite.service'
import { CreateLinkInput, CreateTargetedInput, InvitePreview, InviteView, createLinkSchema, createTargetedSchema } from './invite.dto'

@ApiTags('invites')
@Controller()
@UseGuards(AuthGuard, PendingFieldsGuard)
@ApiBearerAuth()
export class InviteController {
  constructor(private readonly invites: InviteService) {}

  @Post('clans/:clanId/invites')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_invite', Action.CREATE)
  createLink(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string, @Body(new ZodValidationPipe(createLinkSchema)) dto: CreateLinkInput): Promise<InviteView> {
    return this.invites.createLink(user, clanId, dto)
  }

  @Post('clans/:clanId/invites/targeted')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_invite', Action.CREATE)
  createTargeted(
    @CurrentUser() user: AuthUser,
    @Param('clanId') clanId: string,
    @Body(new ZodValidationPipe(createTargetedSchema)) dto: CreateTargetedInput,
  ): Promise<InviteView> {
    return this.invites.createTargeted(user, clanId, dto)
  }

  @Get('clans/:clanId/invites')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_invite', Action.READ)
  list(@Param('clanId') clanId: string): Promise<InviteView[]> {
    return this.invites.list(clanId)
  }

  @Delete('clans/:clanId/invites/:inviteId')
  @HttpCode(204)
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_invite', Action.DELETE)
  revoke(@Param('clanId') clanId: string, @Param('inviteId') inviteId: string): Promise<void> {
    return this.invites.revoke(clanId, inviteId)
  }

  @Get('invites/:code')
  preview(@Param('code') code: string): Promise<InvitePreview> {
    return this.invites.preview(code)
  }

  @Post('invites/:code/redeem')
  redeem(@CurrentUser() user: AuthUser, @Param('code') code: string): Promise<ClanDetail> {
    return this.invites.redeem(code, user)
  }
}
