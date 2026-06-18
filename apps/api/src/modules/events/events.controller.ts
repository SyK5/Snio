import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
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
import { EventsService } from './events.service'
import { CreateEventInput, EventDetailView, EventPage, ListEventsQuery, UpdateEventInput, createEventSchema, listEventsSchema, updateEventSchema } from './events.dto'

@ApiTags('events')
@Controller()
@UseGuards(AuthGuard, PendingFieldsGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get('events')
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(listEventsSchema)) query: ListEventsQuery): Promise<EventPage> {
    return this.events.list(user, query)
  }

  @Get('events/:eventId')
  detail(@CurrentUser() user: AuthUser, @Param('eventId') eventId: string): Promise<EventDetailView> {
    return this.events.detail(user, eventId)
  }

  @Post('events/:eventId/register')
  register(@CurrentUser() user: AuthUser, @Param('eventId') eventId: string): Promise<EventDetailView> {
    return this.events.register(user, eventId)
  }

  @Delete('events/:eventId/register')
  leave(@CurrentUser() user: AuthUser, @Param('eventId') eventId: string): Promise<void> {
    return this.events.leave(user, eventId)
  }

  @Post('events/system')
  createSystem(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventInput): Promise<EventDetailView> {
    return this.events.createSystem(user, dto)
  }

  @Post('clans/:clanId/events')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('event', Action.CREATE)
  createClan(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string, @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventInput): Promise<EventDetailView> {
    return this.events.createClan(clanId, user, dto)
  }

  @Post('organizations/:orgId/events')
  createOrg(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string, @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventInput): Promise<EventDetailView> {
    return this.events.createOrg(orgId, user, dto)
  }

  @Post('clans/:clanId/events/:eventId/participants/:userId/approve')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('event_participation', Action.UPDATE)
  approve(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string, @Param('eventId') eventId: string, @Param('userId') userId: string): Promise<EventDetailView> {
    return this.events.approve(user, clanId, eventId, userId)
  }

  @Delete('clans/:clanId/events/:eventId/participants/:userId')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('event_participation', Action.DELETE)
  reject(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string, @Param('eventId') eventId: string, @Param('userId') userId: string): Promise<EventDetailView> {
    return this.events.reject(user, clanId, eventId, userId)
  }

  @Patch('clans/:clanId/events/:eventId')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('event', Action.UPDATE)
  update(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string, @Param('eventId') eventId: string, @Body(new ZodValidationPipe(updateEventSchema)) dto: UpdateEventInput): Promise<EventDetailView> {
    return this.events.update(user, clanId, eventId, dto)
  }

  @Delete('clans/:clanId/events/:eventId')
  @HttpCode(204)
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('event', Action.DELETE)
  cancel(@Param('clanId') clanId: string, @Param('eventId') eventId: string): Promise<void> {
    return this.events.cancel(clanId, eventId)
  }
}
