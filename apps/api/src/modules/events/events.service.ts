import { Inject, Injectable } from '@nestjs/common'
import { NotificationType, OrganizerKind, ParticipationStatus, Prisma } from '@prisma/client'
import { RLS_PRISMA, RlsPrismaClient } from '../../common/prisma/prisma.extended'
import { S3Service } from '../../common/s3/s3.service'
import { AuthUser } from '../../common/auth/auth.types'
import { NotificationService } from '../notifications/notification.service'
import { toOrganizer } from './organizer'
import { eventErrors } from './event.errors'
import { CreateEventInput, EventDetailView, EventPage, EventView, ListEventsQuery, ParticipantView, UpdateEventInput } from './events.dto'

const EVENT_BASE = {
  clan: { select: { id: true, name: true, slug: true, logo_url: true } },
  organization: { select: { id: true, name: true, slug: true, logo_url: true } },
  game: { select: { id: true, slug: true, name: true, icon_url: true } },
} satisfies Prisma.EventInclude

const PARTICIPANT_SELECT = {
  id: true,
  status: true,
  created_at: true,
  user: { select: { id: true, username: true, display_name: true, discriminator: true } },
} satisfies Prisma.EventParticipationSelect

type EventBasePayload = Prisma.EventGetPayload<{ include: typeof EVENT_BASE }>
type ParticipantPayload = Prisma.EventParticipationGetPayload<{ select: typeof PARTICIPANT_SELECT }>

@Injectable()
export class EventsService {
  constructor(
    @Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient,
    private readonly s3: S3Service,
    private readonly notifications: NotificationService,
  ) {}

  async list(user: AuthUser, query: ListEventsQuery): Promise<EventPage> {
    const take = query.limit + 1
    const events = await this.prisma.event.findMany({
      where: { deleted_at: null, ...(query.cursor ? { id: { lt: query.cursor } } : {}) },
      include: { ...EVENT_BASE, participations: { where: { user_id: user.id }, select: { status: true } } },
      orderBy: { created_at: 'desc' },
      take,
    })
    const hasMore = events.length === take
    const page = hasMore ? events.slice(0, -1) : events
    const items = await Promise.all(page.map(e => this.toView(e, e.participations[0]?.status ?? null)))
    return { items, nextCursor: hasMore ? page[page.length - 1]!.id : null }
  }

  async detail(user: AuthUser, eventId: string): Promise<EventDetailView> {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deleted_at: null },
      include: { ...EVENT_BASE, participations: { select: PARTICIPANT_SELECT, orderBy: { created_at: 'asc' } } },
    })
    if (!event) throw eventErrors.notFound()
    const myStatus = event.participations.find(p => p.user.id === user.id)?.status ?? null
    return { ...(await this.toView(event, myStatus)), participants: event.participations.map(toParticipant) }
  }

  createClan(clanId: string, user: AuthUser, input: CreateEventInput): Promise<EventDetailView> {
    return this.persist('CLAN', user, input, { clanId })
  }

  async createOrg(orgId: string, user: AuthUser, input: CreateEventInput): Promise<EventDetailView> {
    const org = await this.prisma.organization.findFirst({ where: { id: orgId, deleted_at: null } })
    if (!org) throw eventErrors.orgNotFound()
    if (org.owner_id !== user.id && !user.is_platform_admin) throw eventErrors.notOrgOwner()
    return this.persist('ORGANIZATION', user, input, { orgId })
  }

  createSystem(user: AuthUser, input: CreateEventInput): Promise<EventDetailView> {
    if (!user.is_platform_admin) throw eventErrors.notPlatformAdmin()
    return this.persist('SYSTEM', user, input, {})
  }

  async register(user: AuthUser, eventId: string): Promise<EventDetailView> {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, deleted_at: null } })
    if (!event) throw eventErrors.notFound()
    if (event.participant_type !== 'SOLO') throw eventErrors.teamNotSupported()
    if (event.registration_policy === 'CLOSED') throw eventErrors.registrationClosed()
    if (event.registration_policy === 'INVITE_ONLY') throw eventErrors.inviteOnly()
    const now = new Date()
    if (event.registration_opens_at && now < event.registration_opens_at) throw eventErrors.registrationNotOpen()
    if (event.registration_closes_at && now > event.registration_closes_at) throw eventErrors.registrationWindowClosed()
    if (await this.prisma.eventParticipation.findFirst({ where: { event_id: eventId, user_id: user.id } })) throw eventErrors.alreadyRegistered()
    const status = event.requires_approval ? ParticipationStatus.PENDING : ParticipationStatus.CONFIRMED
    await this.prisma.eventParticipation.create({ data: { event_id: eventId, user_id: user.id, status } })
    if (status === ParticipationStatus.PENDING) await this.notifications.emit(event.created_by_id, NotificationType.EVENT_JOIN_REQUEST, { eventId, title: event.title, applicantId: user.id })
    return this.detail(user, eventId)
  }

  async leave(user: AuthUser, eventId: string): Promise<void> {
    const res = await this.prisma.eventParticipation.deleteMany({ where: { event_id: eventId, user_id: user.id } })
    if (!res.count) throw eventErrors.notRegistered()
  }

  async approve(user: AuthUser, clanId: string, eventId: string, targetUserId: string): Promise<EventDetailView> {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, clan_id: clanId, deleted_at: null } })
    if (!event) throw eventErrors.notFound()
    const res = await this.prisma.eventParticipation.updateMany({ where: { event_id: eventId, user_id: targetUserId, status: ParticipationStatus.PENDING }, data: { status: ParticipationStatus.CONFIRMED } })
    if (!res.count) throw eventErrors.participationNotFound()
    await this.notifications.emit(targetUserId, NotificationType.EVENT_JOIN_ACCEPTED, { eventId, title: event.title })
    return this.detail(user, eventId)
  }

  async reject(user: AuthUser, clanId: string, eventId: string, targetUserId: string): Promise<EventDetailView> {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, clan_id: clanId, deleted_at: null } })
    if (!event) throw eventErrors.notFound()
    const res = await this.prisma.eventParticipation.deleteMany({ where: { event_id: eventId, user_id: targetUserId } })
    if (!res.count) throw eventErrors.participationNotFound()
    await this.notifications.emit(targetUserId, NotificationType.EVENT_JOIN_DECLINED, { eventId, title: event.title })
    return this.detail(user, eventId)
  }

  async update(user: AuthUser, clanId: string, eventId: string, input: UpdateEventInput): Promise<EventDetailView> {
    const data: Prisma.EventUpdateManyMutationInput = pruneUndefined({
      title: input.title,
      description: input.description,
      visibility: input.visibility,
      registration_policy: input.registrationPolicy,
      requires_approval: input.requiresApproval,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      registration_opens_at: input.registrationOpensAt,
      registration_closes_at: input.registrationClosesAt,
      location: input.location,
      ruleset: input.ruleset,
    })
    const res = await this.prisma.event.updateMany({ where: { id: eventId, clan_id: clanId, deleted_at: null }, data })
    if (!res.count) throw eventErrors.notFound()
    return this.detail(user, eventId)
  }

  async cancel(clanId: string, eventId: string): Promise<void> {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, clan_id: clanId, deleted_at: null } })
    if (!event) throw eventErrors.notFound()
    const participants = await this.prisma.eventParticipation.findMany({ where: { event_id: eventId }, select: { user_id: true } })
    await this.prisma.event.updateMany({ where: { id: eventId, clan_id: clanId, deleted_at: null }, data: { deleted_at: new Date() } })
    await Promise.all(participants.map(p => this.notifications.emit(p.user_id, NotificationType.EVENT_CANCELLED, { eventId, title: event.title })))
  }

  private async persist(kind: OrganizerKind, user: AuthUser, input: CreateEventInput, ids: { clanId?: string; orgId?: string }): Promise<EventDetailView> {
    if (!(await this.prisma.game.findFirst({ where: { id: input.gameId, deleted_at: null } }))) throw eventErrors.gameNotFound()
    const event = await this.prisma.event.create({
      data: {
        organizer_kind: kind,
        clan_id: ids.clanId ?? null,
        organization_id: ids.orgId ?? null,
        game_id: input.gameId,
        title: input.title,
        description: input.description ?? null,
        visibility: input.visibility,
        registration_policy: input.registrationPolicy,
        requires_approval: input.requiresApproval,
        registration_opens_at: input.registrationOpensAt ?? null,
        registration_closes_at: input.registrationClosesAt ?? null,
        starts_at: input.startsAt,
        ends_at: input.endsAt ?? null,
        location: input.location ?? null,
        ruleset: input.ruleset ?? null,
        created_by_id: user.id,
      },
      include: EVENT_BASE,
    })
    return { ...(await this.toView(event, null)), participants: [] }
  }

  private async toView(e: EventBasePayload, myStatus: ParticipationStatus | null): Promise<EventView> {
    const logoKey = e.organizer_kind === 'CLAN' ? (e.clan?.logo_url ?? null) : e.organizer_kind === 'ORGANIZATION' ? (e.organization?.logo_url ?? null) : null
    const logoUrl = logoKey ? await this.s3.presignDownload(logoKey) : null
    return {
      id: e.id,
      organizer: toOrganizer(e, logoUrl),
      game: { id: e.game.id, slug: e.game.slug, name: e.game.name, iconUrl: e.game.icon_url },
      title: e.title,
      description: e.description,
      visibility: e.visibility,
      registrationPolicy: e.registration_policy,
      participantType: e.participant_type,
      requiresApproval: e.requires_approval,
      startsAt: e.starts_at.toISOString(),
      endsAt: e.ends_at?.toISOString() ?? null,
      registrationOpensAt: e.registration_opens_at?.toISOString() ?? null,
      registrationClosesAt: e.registration_closes_at?.toISOString() ?? null,
      location: e.location,
      ruleset: e.ruleset,
      myStatus,
      createdAt: e.created_at.toISOString(),
    }
  }
}

function toParticipant(p: ParticipantPayload): ParticipantView {
  return {
    id: p.id,
    userId: p.user.id,
    username: p.user.username,
    displayName: p.user.display_name,
    discriminator: p.user.discriminator,
    status: p.status,
    createdAt: p.created_at.toISOString(),
  }
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}
