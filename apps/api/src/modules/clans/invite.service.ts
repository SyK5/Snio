import { Inject, Injectable } from '@nestjs/common'
import { ClanInvite, Prisma, User } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { RLS_PRISMA, RlsPrismaClient } from '../../common/prisma/prisma.extended'
import { runSystem } from '../../common/context/request-context'
import { AuthUser } from '../../common/auth/auth.types'
import { NotificationService } from '../notifications/notification.service'
import { ClansService } from './clans.service'
import { ClanDetail } from './clans.dto'
import { clanErrors } from './clan.errors'
import { inviteErrors } from './invite.errors'
import { CreateLinkInput, CreateTargetedInput, InvitePreview, InviteView } from './invite.dto'

const CODE_ATTEMPTS = 5

@Injectable()
export class InviteService {
  constructor(
    @Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient,
    private readonly clans: ClansService,
    private readonly notifications: NotificationService,
  ) {}

  async createLink(user: AuthUser, clanId: string, input: CreateLinkInput): Promise<InviteView> {
    const invite = await this.insert({ clan_id: clanId, created_by_id: user.id, max_uses: input.maxUses ?? null, expires_at: input.expiresAt ?? null })
    return toInviteView(invite, null)
  }

  async createTargeted(user: AuthUser, clanId: string, input: CreateTargetedInput): Promise<InviteView> {
    const target = await this.prisma.user.findFirst({ where: { username: input.username, discriminator: input.discriminator, deleted_at: null } })
    if (!target) throw inviteErrors.userNotFound()
    const member = await this.prisma.clanMember.findFirst({ where: { clan_id: clanId, user_id: target.id, left_at: null } })
    if (member) throw clanErrors.alreadyMember()
    const dup = await this.prisma.clanInvite.findFirst({ where: { clan_id: clanId, target_user_id: target.id, revoked_at: null } })
    if (dup && (dup.expires_at == null || dup.expires_at > new Date())) throw inviteErrors.alreadyInvited()
    const invite = await this.insert({ clan_id: clanId, created_by_id: user.id, target_user_id: target.id })
    const clan = await this.prisma.clan.findFirst({ where: { id: clanId } })
    await this.notifications.emit(target.id, 'CLAN_INVITE', {
      clanId,
      clanName: clan?.name ?? '',
      clanTag: clan?.tag ?? '',
      code: invite.code,
      invitedById: user.id,
      invitedByName: user.display_name,
      invitedByDiscriminator: user.discriminator,
    })
    return toInviteView(invite, target)
  }

  async list(clanId: string): Promise<InviteView[]> {
    const invites = await this.prisma.clanInvite.findMany({
      where: { clan_id: clanId, revoked_at: null },
      include: { targetUser: true },
      orderBy: { created_at: 'desc' },
    })
    return invites.map(i => toInviteView(i, i.targetUser))
  }

  async revoke(clanId: string, inviteId: string): Promise<void> {
    const invite = await this.prisma.clanInvite.findFirst({ where: { id: inviteId, clan_id: clanId, revoked_at: null } })
    if (!invite) throw inviteErrors.notFound()
    await this.prisma.clanInvite.updateMany({ where: { id: inviteId }, data: { revoked_at: new Date() } })
  }

  async preview(code: string): Promise<InvitePreview> {
    return runSystem(async () => {
      const invite = await this.requireRedeemable(code)
      const clan = await this.prisma.clan.findFirst({ where: { id: invite.clan_id, deleted_at: null } })
      if (!clan) throw clanErrors.notFound()
      return { code, clanId: clan.id, slug: clan.slug, name: clan.name, tag: clan.tag, targeted: invite.target_user_id != null }
    })
  }

  async redeem(code: string, user: AuthUser): Promise<ClanDetail> {
    return runSystem(async () => {
      const invite = await this.requireRedeemable(code)
      if (invite.target_user_id && invite.target_user_id !== user.id) throw inviteErrors.notForYou()
      const clan = await this.prisma.clan.findFirst({ where: { id: invite.clan_id, deleted_at: null } })
      if (!clan) throw clanErrors.notFound()
      if (clan.join_policy === 'CLOSED') throw clanErrors.joinClosed()
      const detail = await this.clans.admit(clan, user)
      await this.prisma.clanInvite.updateMany({ where: { id: invite.id }, data: { uses: { increment: 1 } } })
      return detail
    })
  }

  private async requireRedeemable(code: string): Promise<ClanInvite> {
    const invite = await this.prisma.clanInvite.findFirst({ where: { code } })
    if (!invite) throw inviteErrors.notFound()
    if (invite.revoked_at) throw inviteErrors.revoked()
    if (invite.expires_at && invite.expires_at < new Date()) throw inviteErrors.expired()
    if (invite.max_uses != null && invite.uses >= invite.max_uses) throw inviteErrors.exhausted()
    return invite
  }

  private async insert(data: Omit<Prisma.ClanInviteUncheckedCreateInput, 'code'>): Promise<ClanInvite> {
    for (let i = 0; i < CODE_ATTEMPTS; i++) {
      try {
        return await this.prisma.clanInvite.create({ data: { ...data, code: genCode() } })
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue
        throw e
      }
    }
    throw inviteErrors.createFailed()
  }
}

function genCode(): string {
  return randomBytes(8).toString('base64url')
}

function toInviteView(invite: ClanInvite, target: Pick<User, 'id' | 'username' | 'display_name' | 'discriminator'> | null): InviteView {
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
