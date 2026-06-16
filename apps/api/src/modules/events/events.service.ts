import { Inject, Injectable } from '@nestjs/common'
import { OrganizerKind, Prisma } from '@prisma/client'
import { RLS_PRISMA, RlsPrismaClient } from '../../common/prisma/prisma.extended'
import { runSystem } from '../../common/context/request-context'
import { S3Service } from '../../common/s3/s3.service'
import { AuthUser } from '../../common/auth/auth.types'
import { toOrganizer } from './organizer'
import { eventErrors } from './event.errors'
import { CreateEventInput, EventPage, EventView, ListEventsQuery } from './events.dto'

const EVENT_INCLUDE = {
  clan: { select: { id: true, name: true, slug: true, logo_url: true } },
  organization: { select: { id: true, name: true, slug: true, logo_url: true } },
  game: { select: { id: true, slug: true, name: true, icon_url: true } },
} satisfies Prisma.EventInclude

type EventWithRelations = Prisma.EventGetPayload<{ include: typeof EVENT_INCLUDE }>

@Injectable()
export class EventsService {
  constructor(
    @Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient,
    private readonly s3: S3Service,
  ) {}

  async list(query: ListEventsQuery): Promise<EventPage> {
    const take = query.limit + 1
    const events = await this.prisma.event.findMany({
      where: { deleted_at: null, ...(query.cursor ? { id: { lt: query.cursor } } : {}) },
      include: EVENT_INCLUDE,
      orderBy: { created_at: 'desc' },
      take,
    })
    const hasMore = events.length === take
    const page = hasMore ? events.slice(0, -1) : events
    const items = await Promise.all(page.map(e => this.toView(e)))
    return { items, nextCursor: hasMore ? page[page.length - 1]!.id : null }
  }

  async detail(eventId: string): Promise<EventView> {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, deleted_at: null }, include: EVENT_INCLUDE })
    if (!event) throw eventErrors.notFound()
    return this.toView(event)
  }

  createClan(clanId: string, user: AuthUser, input: CreateEventInput): Promise<EventView> {
    return this.persist('CLAN', user, input, { clanId })
  }

  async createOrg(orgId: string, user: AuthUser, input: CreateEventInput): Promise<EventView> {
    const org = await this.prisma.organization.findFirst({ where: { id: orgId, deleted_at: null } })
    if (!org) throw eventErrors.orgNotFound()
    if (org.owner_id !== user.id && !user.is_platform_admin) throw eventErrors.notOrgOwner()
    return this.persist('ORGANIZATION', user, input, { orgId })
  }

  createSystem(user: AuthUser, input: CreateEventInput): Promise<EventView> {
    if (!user.is_platform_admin) throw eventErrors.notPlatformAdmin()
    return this.persist('SYSTEM', user, input, {})
  }

  private async persist(kind: OrganizerKind, user: AuthUser, input: CreateEventInput, ids: { clanId?: string; orgId?: string }): Promise<EventView> {
    if (!(await this.prisma.game.findFirst({ where: { id: input.gameId, deleted_at: null } }))) throw eventErrors.gameNotFound()
    const event = await runSystem(() =>
      this.prisma.event.create({
        data: {
          organizer_kind: kind,
          clan_id: ids.clanId ?? null,
          organization_id: ids.orgId ?? null,
          game_id: input.gameId,
          title: input.title,
          description: input.description ?? null,
          starts_at: input.startsAt,
          ends_at: input.endsAt ?? null,
          location: input.location ?? null,
          ruleset: input.ruleset ?? null,
          created_by_id: user.id,
        },
        include: EVENT_INCLUDE,
      }),
    )
    return this.toView(event)
  }

  private async toView(e: EventWithRelations): Promise<EventView> {
    const logoKey = e.organizer_kind === 'CLAN' ? (e.clan?.logo_url ?? null) : e.organizer_kind === 'ORGANIZATION' ? (e.organization?.logo_url ?? null) : null
    const logoUrl = logoKey ? await this.s3.presignDownload(logoKey) : null
    return {
      id: e.id,
      organizer: toOrganizer(e, logoUrl),
      game: { id: e.game.id, slug: e.game.slug, name: e.game.name, iconUrl: e.game.icon_url },
      title: e.title,
      description: e.description,
      startsAt: e.starts_at.toISOString(),
      endsAt: e.ends_at?.toISOString() ?? null,
      location: e.location,
      ruleset: e.ruleset,
      createdAt: e.created_at.toISOString(),
    }
  }
}
