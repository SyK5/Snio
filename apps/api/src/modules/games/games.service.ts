import { Inject, Injectable } from '@nestjs/common'
import { Game, Prisma } from '@prisma/client'
import { randomBytes, randomUUID } from 'node:crypto'
import { RLS_PRISMA, RlsPrismaClient } from '../../common/prisma/prisma.extended'
import { S3Service } from '../../common/s3/s3.service'
import { AuthUser } from '../../common/auth/auth.types'
import { gameErrors } from './game.errors'
import { CreateGameInput, GameIconPresignResponse, GameView, ICON_TYPES, TYPE_EXTENSIONS, UpdateGameInput } from './games.dto'

const SLUG_ATTEMPTS = 6

@Injectable()
export class GamesService {
  constructor(
    @Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient,
    private readonly s3: S3Service,
  ) {}

  async list(): Promise<GameView[]> {
    const games = await this.prisma.game.findMany({ where: { deleted_at: null }, orderBy: { name: 'asc' } })
    return Promise.all(games.map(g => this.toView(g)))
  }

  async create(user: AuthUser, input: CreateGameInput): Promise<GameView> {
    this.assertAdmin(user)
    if (input.iconKey) this.assertIconKey(input.iconKey)
    let slug = slugify(input.name)
    for (let i = 0; i < SLUG_ATTEMPTS; i++) {
      try {
        const game = await this.prisma.game.create({ data: { slug, name: input.name, icon_url: input.iconKey ?? null } })
        return this.toView(game)
      } catch (e) {
        if (!uniqueTargets(e).includes('slug')) throw e
        slug = `${slugify(input.name)}-${shortId()}`
      }
    }
    throw gameErrors.createFailed()
  }

  async update(user: AuthUser, gameId: string, input: UpdateGameInput): Promise<GameView> {
    this.assertAdmin(user)
    if (input.iconKey) this.assertIconKey(input.iconKey)
    const game = await this.prisma.game.findFirst({ where: { id: gameId, deleted_at: null } })
    if (!game) throw gameErrors.notFound()
    const data: Prisma.GameUpdateManyMutationInput = {}
    if (input.name !== undefined) data.name = input.name
    if (input.iconKey !== undefined) data.icon_url = input.iconKey
    await this.prisma.game.updateMany({ where: { id: gameId, deleted_at: null }, data })
    if (input.iconKey !== undefined && game.icon_url && game.icon_url !== input.iconKey) await this.s3.deleteObject(game.icon_url).catch(() => undefined)
    return this.toView({ ...game, name: input.name ?? game.name, icon_url: input.iconKey !== undefined ? input.iconKey : game.icon_url })
  }

  async remove(user: AuthUser, gameId: string): Promise<void> {
    this.assertAdmin(user)
    const res = await this.prisma.game.updateMany({ where: { id: gameId, deleted_at: null }, data: { deleted_at: new Date() } })
    if (!res.count) throw gameErrors.notFound()
  }

  async presignIcon(user: AuthUser, contentType: (typeof ICON_TYPES)[number]): Promise<GameIconPresignResponse> {
    this.assertAdmin(user)
    const key = `games/icons/${randomUUID()}.${TYPE_EXTENSIONS[contentType]}`
    const maxBytes = this.s3.avatarMaxBytes
    const presigned = await this.s3.presignUpload(key, contentType, maxBytes)
    return { key, url: presigned.url, fields: presigned.fields, maxBytes }
  }

  private assertAdmin(user: AuthUser): void {
    if (!user.is_platform_admin) throw gameErrors.notPlatformAdmin()
  }

  private assertIconKey(key: string): void {
    if (!key.startsWith('games/')) throw gameErrors.iconKeyInvalid()
  }

  private async toView(game: Game): Promise<GameView> {
    return { id: game.id, slug: game.slug, name: game.name, iconUrl: game.icon_url ? await this.s3.presignDownload(game.icon_url) : null }
  }
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || 'game'
}

function shortId(): string {
  return randomBytes(3).toString('hex')
}

function uniqueTargets(e: unknown): string[] {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return []
  const target = e.meta?.target
  if (Array.isArray(target)) return target as string[]
  return typeof target === 'string' ? [target] : []
}
