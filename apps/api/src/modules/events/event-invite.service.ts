import { Inject, Injectable } from '@nestjs/common'
import { Event, EventInvite, NotificationType, ParticipationStatus, Prisma, User } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { RLS_PRISMA, RlsPrismaClient } from '../../common/prisma/prisma.extended'
import { runSystem } from '../../common/context/request-context'
import { AuthUser } from '../../common/auth/auth.types'
import { NotificationService } from '../notifications/notification.service'
import { EventsService } from './events.service'
import { EventDetailView } from './events.dto'
import { eventErrors } from './event.errors'
import { eventInviteErrors } from './event-invite.errors'
import { CreateEventInviteLinkInput, CreateEventInviteTargetedInput, EventInvitePreview, EventInviteView } from './event-invite.dto'

const CODE_ATTEMPTS = 5

@Injectable()
export class EventInviteService {
  constructor(
    @Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient,
    private readonly events: EventsService,
    private readonly notifications: NotificationService,
  ) {}

  async createLink(user: AuthUser, clanId: string, eventId: string, input: CreateEventInviteLinkInput): Promise<EventInviteView> {
    await this.requireClanEvent(clanId, eventId)
    const invite = await this.insert({ event_id: eventId, created_by_id: user.id, max_uses: input.maxUses ?? null, expires_at: input.expiresAt ?? null })
    return toView(invite, null)
  }

  async createTargeted(user: AuthUser, clanId: string, eventId: string, input: CreateEventInviteTargetedInput): Promise<EventInviteView> {
    const event = await this.requireClanEvent(clanId, eventId)
    const target = await this.prisma.user.findFirst({ where: { username: input.username, discriminator: input.discriminator, deleted_at: null } })
    if (!target) throw eventInviteErrors.userNotFound()
    if (await this.prisma.eventParticipation.findFirst({ where: { event_id: eventId, user_id: target.id } })) throw eventErrors.alreadyRegistered()
    const dup = await this.prisma.eventInvite.findFirst({ where: { event_id: eventId, target_user_id: target.id, revoked_at: null } })
    if (dup && (dup.expires_at == null || dup.expires_at > new Date())) throw eventInviteErrors.alreadyInvited()
    const invite = await this.insert({ event_id: eventId, created_by_id: user.id, target_user_id: target.id })
    await this.notifications.emit(target.id, NotificationType.EVENT_INVITE, { eventId, title: event.title, code: invite.code, invitedById: user.id })
    return toView(invite, target)
  }

  async list(clanId: string, eventId: string): Promise<EventInviteView[]> {
    await this.requireClanEvent(clanId, eventId)
    const invites = await this.prisma.eventInvite.findMany({
      where: { event_id: eventId, revoked_at: null },
      include: { targetUser: true },
      orderBy: { created_at: 'desc' },
    })
    return invites.map(i => toView(i, i.targetUser))
  }

  async revoke(clanId: string, eventId: string, inviteId: string): Promise<void> {
    await this.requireClanEvent(clanId, eventId)
    const invite = await this.prisma.eventInvite.findFirst({ where: { id: inviteId, event_id: eventId, revoked_at: null } })
    if (!invite) throw eventInviteErrors.notFound()
    await this.prisma.eventInvite.updateMany({ where: { id: inviteId }, data: { revoked_at: new Date() } })
  }

  async preview(code: string): Promise<EventInvitePreview> {
    return runSystem(async () => {
      const invite = await this.requireRedeemable(code)
      const event = await this.prisma.event.findFirst({ where: { id: invite.event_id, deleted_at: null } })
      if (!event) throw eventErrors.notFound()
      return { code, eventId: event.id, title: event.title, targeted: invite.target_user_id != null }
    })
  }

  async redeem(code: string, user: AuthUser): Promise<EventDetailView> {
    const eventId = await runSystem(async () => {
      const invite = await this.requireRedeemable(code)
      if (invite.target_user_id && invite.target_user_id !== user.id) throw eventInviteErrors.notForYou()
      const event = await this.prisma.event.findFirst({ where: { id: invite.event_id, deleted_at: null } })
      if (!event) throw eventErrors.notFound()
      if (event.participant_type !== 'SOLO') throw eventErrors.teamNotSupported()
      if (event.registration_policy === 'CLOSED') throw eventErrors.registrationClosed()
      if (await this.prisma.eventParticipation.findFirst({ where: { event_id: event.id, user_id: user.id } })) throw eventErrors.alreadyRegistered()
      await this.prisma.eventParticipation.create({ data: { event_id: event.id, user_id: user.id, status: ParticipationStatus.CONFIRMED } })
      await this.prisma.eventInvite.updateMany({ where: { id: invite.id }, data: { uses: { increment: 1 } } })
      return event.id
    })
    return this.events.detail(user, eventId)
  }

  private async requireClanEvent(clanId: string, eventId: string): Promise<Event> {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, clan_id: clanId, deleted_at: null } })
    if (!event) throw eventErrors.notFound()
    return event
  }

  private async requireRedeemable(code: string): Promise<EventInvite> {
    const invite = await this.prisma.eventInvite.findFirst({ where: { code } })
    if (!invite) throw eventInviteErrors.notFound()
    if (invite.revoked_at) throw eventInviteErrors.revoked()
    if (invite.expires_at && invite.expires_at < new Date()) throw eventInviteErrors.expired()
    if (invite.max_uses != null && invite.uses >= invite.max_uses) throw eventInviteErrors.exhausted()
    return invite
  }

  private async insert(data: Omit<Prisma.EventInviteUncheckedCreateInput, 'code'>): Promise<EventInvite> {
    for (let i = 0; i < CODE_ATTEMPTS; i++) {
      try {
        return await this.prisma.eventInvite.create({ data: { ...data, code: genCode() } })
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue
        throw e
      }
    }
    throw eventInviteErrors.createFailed()
  }
}

function genCode(): string {
  return randomBytes(8).toString('base64url')
}

function toView(invite: EventInvite, target: Pick<User, 'id' | 'username' | 'display_name' | 'discriminator'> | null): EventInviteView {
  return {
    id: invite.id,
    code: invite.code,
    target: target ? { userId: target.id, username: target.username, displayName: target.display_name, discriminator: target.discriminator } : null,
    maxUses: invite.max_uses,
    uses: invite.uses,
    expiresAt: invite.expires_at?.toISOString() ?? null,
    createdAt: invite.created_at.toISOString(),
  }
}
