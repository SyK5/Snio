import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
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
import { CreateEventInput, EventPage, EventView, ListEventsQuery, createEventSchema, listEventsSchema } from './events.dto'

@ApiTags('events')
@Controller()
@UseGuards(AuthGuard, PendingFieldsGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get('events')
  list(@Query(new ZodValidationPipe(listEventsSchema)) query: ListEventsQuery): Promise<EventPage> {
    return this.events.list(query)
  }

  @Get('events/:eventId')
  detail(@Param('eventId') eventId: string): Promise<EventView> {
    return this.events.detail(eventId)
  }

  @Post('events/system')
  createSystem(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventInput): Promise<EventView> {
    return this.events.createSystem(user, dto)
  }

  @Post('clans/:clanId/events')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('event', Action.CREATE)
  createClan(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string, @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventInput): Promise<EventView> {
    return this.events.createClan(clanId, user, dto)
  }

  @Post('organizations/:orgId/events')
  createOrg(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string, @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventInput): Promise<EventView> {
    return this.events.createOrg(orgId, user, dto)
  }
}
