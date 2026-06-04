import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Clan, Prisma } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { RLS_PRISMA, RlsPrismaClient, RlsTransactionClient } from '../../common/prisma/prisma.extended'
import { runSystem } from '../../common/context/request-context'
import { S3Service } from '../../common/s3/s3.service'
import { PermissionService } from '../../common/rls/permission.service'
import { DefaultRoleKey, ROLE_GRANT_DEFAULTS, SYSTEM_ROLES, SystemRoleKey, grantRows } from '../../common/rls/role-templates'
import { AuthUser } from '../../common/auth/auth.types'
import { ClanDetail, ClanMemberView, ClanSummary, CreateClanInput, UpdateClanInput } from './clans.dto'

const SLUG_ATTEMPTS = 6

const MEMBER_INCLUDE = {
  user: { select: { id: true, username: true, display_name: true, discriminator: true, avatar_url: true } },
  roles: { include: { role: true } },
} satisfies Prisma.ClanMemberInclude

type MemberWithRelations = Prisma.ClanMemberGetPayload<{ include: typeof MEMBER_INCLUDE }>

@Injectable()
export class ClansService {
  constructor(
    @Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient,
    private readonly s3: S3Service,
    private readonly permissions: PermissionService,
  ) {}

  async create(user: AuthUser, input: CreateClanInput): Promise<ClanDetail> {
    let slug = slugify(input.name)
    for (let i = 0; i < SLUG_ATTEMPTS; i++) {
      try {
        const clan = await runSystem(() => this.persistClan(user, input, slug))
        return this.toDetail(clan, 1, user.id)
      } catch (e) {
        const targets = uniqueTargets(e)
        if (targets.includes('tag')) throw new ConflictException('Clan Tag bereits vergeben')
        if (!targets.includes('slug')) throw e
        slug = `${slugify(input.name)}-${shortId()}`
      }
    }
    throw new ConflictException('Clan konnte nicht angelegt werden, bitte anderen Namen wählen')
  }

  async list(): Promise<ClanSummary[]> {
    const clans = await this.prisma.clan.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } })
    if (clans.length === 0) return []
    const counts = await this.prisma.clanMember.groupBy({ by: ['clan_id'], where: { clan_id: { in: clans.map((c) => c.id) }, left_at: null }, _count: { _all: true } })
    const countMap = new Map(counts.map((c) => [c.clan_id, c._count._all]))
    return Promise.all(clans.map((c) => this.toSummary(c, countMap.get(c.id) ?? 0)))
  }

  async detail(clanId: string, userId: string): Promise<ClanDetail> {
    const clan = await this.prisma.clan.findFirst({ where: { id: clanId, deleted_at: null } })
    if (!clan) throw new NotFoundException('Clan nicht gefunden')
    const memberCount = await this.prisma.clanMember.count({ where: { clan_id: clanId, left_at: null } })
    return this.toDetail(clan, memberCount, userId)
  }

  async update(clanId: string, userId: string, input: UpdateClanInput): Promise<ClanDetail> {
    const data: Prisma.ClanUpdateManyMutationInput = {}
    if (input.name !== undefined) data.name = input.name
    if (input.tag !== undefined) data.tag = input.tag
    if (input.description !== undefined) data.description = input.description
    try {
      await this.prisma.clan.updateMany({ where: { id: clanId, deleted_at: null }, data })
    } catch (e) {
      if (uniqueTargets(e).includes('tag')) throw new ConflictException('Clan Tag bereits vergeben')
      throw e
    }
    return this.detail(clanId, userId)
  }

  async softDelete(clanId: string): Promise<void> {
    await this.prisma.clan.updateMany({ where: { id: clanId, deleted_at: null }, data: { deleted_at: new Date() } })
  }

  async join(clanId: string, user: AuthUser): Promise<ClanDetail> {
    return runSystem(async () => {
      const clan = await this.prisma.clan.findFirst({ where: { id: clanId, deleted_at: null } })
      if (!clan) throw new NotFoundException('Clan nicht gefunden')
      const existing = await this.prisma.clanMember.findFirst({ where: { clan_id: clanId, user_id: user.id } })
      if (existing?.left_at === null) throw new ConflictException('Bereits Mitglied dieses Clans')

      const memberId = existing ? await this.reactivateMember(existing.id) : await this.createMember(clanId, user.id)
      await this.assignSystemRole(memberId, clanId, 'member')
      const memberCount = await this.prisma.clanMember.count({ where: { clan_id: clanId, left_at: null } })
      return this.toDetail(clan, memberCount, user.id)
    })
  }

  async leave(clanId: string, user: AuthUser): Promise<void> {
    const clan = await this.prisma.clan.findFirst({ where: { id: clanId } })
    if (clan?.owner_id === user.id) throw new ForbiddenException('Owner muss den Clan zuerst übertragen oder löschen')
    const member = await this.prisma.clanMember.findFirst({ where: { user_id: user.id, left_at: null } })
    if (!member) throw new NotFoundException('Keine aktive Mitgliedschaft')
    await this.deactivateMember(member.id)
  }

  async kick(clanId: string, memberId: string): Promise<void> {
    const member = await this.prisma.clanMember.findFirst({ where: { id: memberId, left_at: null }, include: { roles: { select: { role: { select: { position: true } } } } } })
    if (!member) throw new NotFoundException('Mitglied nicht gefunden')
    const clan = await this.prisma.clan.findFirst({ where: { id: clanId } })
    if (member.user_id === clan?.owner_id) throw new ForbiddenException('Owner kann nicht entfernt werden')
    if (!this.permissions.canManageRole(highestPosition(member.roles))) throw new ForbiddenException('Mitglied hat eine gleich hohe oder höhere Rolle')
    await this.deactivateMember(memberId)
  }

  async listMembers(): Promise<ClanMemberView[]> {
    const members = await this.prisma.clanMember.findMany({ where: { left_at: null }, include: MEMBER_INCLUDE, orderBy: { joined_at: 'asc' } })
    return Promise.all(members.map((m) => this.toMemberView(m)))
  }

  async assignRole(memberId: string, roleId: string): Promise<ClanMemberView> {
    const member = await this.prisma.clanMember.findFirst({ where: { id: memberId, left_at: null } })
    if (!member) throw new NotFoundException('Mitglied nicht gefunden')
    const role = await this.prisma.clanRoleDef.findFirst({ where: { id: roleId } })
    if (!role) throw new NotFoundException('Rolle nicht gefunden')
    if (role.is_system && role.key === 'owner') throw new ForbiddenException('Owner Rolle kann nicht manuell vergeben werden')
    if (!this.permissions.canManageRole(role.position)) throw new ForbiddenException('Rolle liegt über deiner eigenen Position')
    await this.prisma.clanMemberRole.createMany({ data: [{ member_id: memberId, role_id: roleId }], skipDuplicates: true })
    return this.memberView(memberId)
  }

  async removeRole(memberId: string, roleId: string): Promise<ClanMemberView> {
    const role = await this.prisma.clanRoleDef.findFirst({ where: { id: roleId } })
    if (role?.is_system && role.key === 'owner') throw new ForbiddenException('Owner Rolle kann nicht entfernt werden')
    if (role && !this.permissions.canManageRole(role.position)) throw new ForbiddenException('Rolle liegt über deiner eigenen Position')
    await this.prisma.clanMemberRole.deleteMany({ where: { member_id: memberId, role_id: roleId } })
    return this.memberView(memberId)
  }

  private persistClan(user: AuthUser, input: CreateClanInput, slug: string): Promise<Clan> {
    return this.prisma.$transaction(async (tx) => {
      const clan = await tx.clan.create({ data: { slug, name: input.name, tag: input.tag, description: input.description ?? null, owner_id: user.id } })
      const roleIds = await this.seedSystemRoles(tx, clan.id)
      const member = await tx.clanMember.create({ data: { clan_id: clan.id, user_id: user.id } })
      await tx.clanMemberRole.create({ data: { member_id: member.id, role_id: roleIds.owner } })
      return clan
    })
  }

  private async seedSystemRoles(tx: RlsTransactionClient, clanId: string): Promise<Record<SystemRoleKey, string>> {
    const ids = {} as Record<SystemRoleKey, string>
    for (const role of SYSTEM_ROLES) {
      const grants = ROLE_GRANT_DEFAULTS[role.key as DefaultRoleKey]
      const created = await tx.clanRoleDef.create({
        data: { clan_id: clanId, key: role.key, name: role.name, color: role.color, position: role.position, is_system: true, grants: grants ? { create: grantRows(grants) } : undefined },
      })
      ids[role.key] = created.id
    }
    return ids
  }

  private async createMember(clanId: string, userId: string): Promise<string> {
    const member = await this.prisma.clanMember.create({ data: { clan_id: clanId, user_id: userId } })
    return member.id
  }

  private async reactivateMember(memberId: string): Promise<string> {
    await this.prisma.clanMember.updateMany({ where: { id: memberId }, data: { left_at: null, joined_at: new Date() } })
    return memberId
  }

  private async assignSystemRole(memberId: string, clanId: string, key: SystemRoleKey): Promise<void> {
    const role = await this.prisma.clanRoleDef.findFirstOrThrow({ where: { clan_id: clanId, key } })
    await this.prisma.clanMemberRole.createMany({ data: [{ member_id: memberId, role_id: role.id }], skipDuplicates: true })
  }

  private async deactivateMember(memberId: string): Promise<void> {
    await this.prisma.clanMemberRole.deleteMany({ where: { member_id: memberId } })
    await this.prisma.clanMember.updateMany({ where: { id: memberId }, data: { left_at: new Date() } })
  }

  private async memberView(memberId: string): Promise<ClanMemberView> {
    const member = await this.prisma.clanMember.findFirstOrThrow({ where: { id: memberId }, include: MEMBER_INCLUDE })
    return this.toMemberView(member)
  }

  private async toSummary(clan: Clan, memberCount: number): Promise<ClanSummary> {
    return { id: clan.id, slug: clan.slug, name: clan.name, tag: clan.tag, logoUrl: await this.resolveImage(clan.logo_url), memberCount }
  }

  private async toDetail(clan: Clan, memberCount: number, userId: string): Promise<ClanDetail> {
    const summary = await this.toSummary(clan, memberCount)
    return { ...summary, description: clan.description, ownerId: clan.owner_id, isOwner: clan.owner_id === userId, createdAt: clan.created_at.toISOString() }
  }

  private async toMemberView(m: MemberWithRelations): Promise<ClanMemberView> {
    const roles = m.roles.map((r) => ({ id: r.role.id, key: r.role.key, name: r.role.name, color: r.role.color, position: r.role.position })).sort((a, b) => b.position - a.position)
    return {
      id: m.id,
      userId: m.user_id,
      username: m.user.username,
      displayName: m.user.display_name,
      discriminator: m.user.discriminator,
      avatarUrl: await this.resolveImage(m.user.avatar_url),
      joinedAt: m.joined_at.toISOString(),
      roles,
    }
  }

  private resolveImage(key: string | null): Promise<string> | null {
    return key ? this.s3.presignDownload(key) : null
  }
}

function slugify(value: string): string {
  const base = value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  return base || 'clan'
}

function shortId(): string {
  return randomBytes(3).toString('hex')
}

function highestPosition(roles: { role: { position: number } }[]): number {
  return roles.reduce((max, r) => (r.role.position > max ? r.role.position : max), -1)
}

function uniqueTargets(e: unknown): string[] {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return []
  const target = e.meta?.target
  if (Array.isArray(target)) return target as string[]
  return typeof target === 'string' ? [target] : []
}
