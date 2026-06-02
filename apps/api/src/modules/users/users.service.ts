import { BadRequestException, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { PrismaService } from '../../common/prisma/prisma.service'
import { S3Service } from '../../common/s3/s3.service'
import { AuthUser } from '../../common/auth/auth.types'
import { AvatarPresignResponse, MeResponse, TYPE_EXTENSIONS, AVATAR_TYPES } from './users.dto'

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
      displayName: user.display_name,
      emailVerified: user.email_verified,
      avatarUrl: await this.resolveAvatar(user.avatar_url),
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
}
