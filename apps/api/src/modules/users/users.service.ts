import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { randomInt, randomUUID } from 'node:crypto'
import { PrismaService } from '../../common/prisma/prisma.service'
import { S3Service } from '../../common/s3/s3.service'
import { AuthUser } from '../../common/auth/auth.types'
import { AvatarPresignResponse, MeResponse, UpdateProfileInput, UpdateUsernameInput, TYPE_EXTENSIONS, AVATAR_TYPES } from './users.dto'

const DISCRIMINATOR_ATTEMPTS = 8
const USERNAME_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async toMeResponse(user: AuthUser): Promise<MeResponse> {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      usernameChangedAt: user.username_changed_at ? user.username_changed_at.toISOString() : null,
      displayName: user.display_name,
      discriminator: user.discriminator,
      emailVerified: user.email_verified,
      isPlatformAdmin: user.is_platform_admin,
      avatarUrl: await this.resolveAvatar(user.avatar_url),
      pendingFields: user.pending_fields,
    }
  }

  async updateProfile(user: AuthUser, input: UpdateProfileInput): Promise<MeResponse> {
    const renaming = input.displayName !== user.display_name
    const data: Prisma.UserUpdateInput = { display_name: input.displayName }
    if (renaming) data.discriminator = await this.freeDiscriminator(input.displayName, user.id)

    const updated = await this.applyProfile(user.id, data, renaming, input.displayName)
    return this.toMeResponse(updated)
  }

  async updateUsername(user: AuthUser, input: UpdateUsernameInput): Promise<MeResponse> {
    const pending = user.pending_fields.includes('username')
    if (!pending) this.assertCooldown(user.username_changed_at)
    if (input.username === user.username) throw new BadRequestException('Benutzername unverändert')

    const data: Prisma.UserUpdateInput = { username: input.username, username_changed_at: new Date() }
    if (pending) data.pending_fields = user.pending_fields.filter(f => f !== 'username')

    try {
      const updated = await this.prisma.user.update({ where: { id: user.id }, data })
      return this.toMeResponse(updated)
    } catch (e) {
      if (uniqueTargets(e).includes('username')) throw new ConflictException('Benutzername bereits vergeben')
      throw e
    }
  }

  async presignAvatar(userId: string, contentType: (typeof AVATAR_TYPES)[number]): Promise<AvatarPresignResponse> {
    const key = `avatars/${userId}/${randomUUID()}.${TYPE_EXTENSIONS[contentType]}`
    const maxBytes = this.s3.avatarMaxBytes
    const presigned = await this.s3.presignUpload(key, contentType, maxBytes)
    return { key, url: presigned.url, fields: presigned.fields, maxBytes }
  }

  async confirmAvatar(user: AuthUser, key: string): Promise<MeResponse> {
    if (!key.startsWith(`avatars/${user.id}/`)) throw new BadRequestException('Ungültiger Key')

    const previous = user.avatar_url
    const updated = await this.prisma.user.update({ where: { id: user.id }, data: { avatar_url: key } })
    if (previous && previous !== key) await this.s3.deleteObject(previous).catch(() => undefined)

    return this.toMeResponse(updated)
  }

  async removeAvatar(user: AuthUser): Promise<MeResponse> {
    if (!user.avatar_url) return this.toMeResponse(user)
    const updated = await this.prisma.user.update({ where: { id: user.id }, data: { avatar_url: null } })
    await this.s3.deleteObject(user.avatar_url).catch(() => undefined)
    return this.toMeResponse(updated)
  }

  private resolveAvatar(key: string | null): Promise<string> | null {
    if (!key) return null
    return this.s3.presignDownload(key)
  }

  private assertCooldown(changedAt: Date | null): void {
    if (!changedAt) return
    const next = changedAt.getTime() + USERNAME_COOLDOWN_MS
    if (Date.now() >= next) return
    throw new ForbiddenException(`Nächste kostenlose Änderung ab ${new Date(next).toISOString()}`)
  }

  private async applyProfile(userId: string, data: Prisma.UserUpdateInput, renaming: boolean, displayName?: string): Promise<AuthUser> {
    for (let i = 0; i < DISCRIMINATOR_ATTEMPTS; i++) {
      try {
        return await this.prisma.user.update({ where: { id: userId }, data })
      } catch (e) {
        const targets = uniqueTargets(e)
        if (targets.includes('username')) throw new ConflictException('Benutzername bereits vergeben')
        if (renaming && displayName && (targets.includes('discriminator') || targets.includes('display_name'))) {
          data.discriminator = await this.freeDiscriminator(displayName, userId)
          continue
        }
        throw e
      }
    }
    throw new ConflictException('Kein freier Discriminator für diesen Anzeigenamen, bitte anderen wählen')
  }

  private async freeDiscriminator(displayName: string, selfId: string): Promise<string> {
    const rows = await this.prisma.user.findMany({ where: { display_name: displayName, id: { not: selfId } }, select: { discriminator: true } })
    const taken = new Set(rows.map(r => r.discriminator))
    if (taken.size >= 9999) throw new ConflictException('Anzeigename ausgeschöpft, bitte anderen wählen')
    let tag = randomDiscriminator()
    while (taken.has(tag)) tag = randomDiscriminator()
    return tag
  }
}

function randomDiscriminator(): string {
  return String(randomInt(1, 10000)).padStart(4, '0')
}

function uniqueTargets(e: unknown): string[] {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return []
  const target = e.meta?.target
  if (Array.isArray(target)) return target as string[]
  return typeof target === 'string' ? [target] : []
}
