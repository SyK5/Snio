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
import { EventDetailView } from './events.dto'
import { EventInviteService } from './event-invite.service'
import { CreateEventInviteLinkInput, CreateEventInviteTargetedInput, EventInvitePreview, EventInviteView, createEventInviteLinkSchema, createEventInviteTargetedSchema } from './event-invite.dto'

@ApiTags('event-invites')
@Controller()
@UseGuards(AuthGuard, PendingFieldsGuard)
@ApiBearerAuth()
export class EventInviteController {
  constructor(private readonly invites: EventInviteService) {}

  @Post('clans/:clanId/events/:eventId/invites')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('event_participation', Action.CREATE)
  createLink(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string, @Param('eventId') eventId: string, @Body(new ZodValidationPipe(createEventInviteLinkSchema)) dto: CreateEventInviteLinkInput): Promise<EventInviteView> {
    return this.invites.createLink(user, clanId, eventId, dto)
  }

  @Post('clans/:clanId/events/:eventId/invites/targeted')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('event_participation', Action.CREATE)
  createTargeted(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string, @Param('eventId') eventId: string, @Body(new ZodValidationPipe(createEventInviteTargetedSchema)) dto: CreateEventInviteTargetedInput): Promise<EventInviteView> {
    return this.invites.createTargeted(user, clanId, eventId, dto)
  }

  @Get('clans/:clanId/events/:eventId/invites')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('event_participation', Action.READ)
  list(@Param('clanId') clanId: string, @Param('eventId') eventId: string): Promise<EventInviteView[]> {
    return this.invites.list(clanId, eventId)
  }

  @Delete('clans/:clanId/events/:eventId/invites/:inviteId')
  @HttpCode(204)
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('event_participation', Action.DELETE)
  revoke(@Param('clanId') clanId: string, @Param('eventId') eventId: string, @Param('inviteId') inviteId: string): Promise<void> {
    return this.invites.revoke(clanId, eventId, inviteId)
  }

  @Get('event-invites/:code')
  preview(@Param('code') code: string): Promise<EventInvitePreview> {
    return this.invites.preview(code)
  }

  @Post('event-invites/:code/redeem')
  redeem(@CurrentUser() user: AuthUser, @Param('code') code: string): Promise<EventDetailView> {
    return this.invites.redeem(code, user)
  }
}
