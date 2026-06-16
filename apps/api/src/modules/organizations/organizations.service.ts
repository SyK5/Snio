import { Inject, Injectable } from '@nestjs/common'
import { Organization, Prisma } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { RLS_PRISMA, RlsPrismaClient } from '../../common/prisma/prisma.extended'
import { S3Service } from '../../common/s3/s3.service'
import { AuthUser } from '../../common/auth/auth.types'
import { orgErrors } from './organization.errors'
import { CreateOrgInput, OrgView } from './organizations.dto'

const SLUG_ATTEMPTS = 6

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient,
    private readonly s3: S3Service,
  ) {}

  async create(user: AuthUser, input: CreateOrgInput): Promise<OrgView> {
    let slug = slugify(input.name)
    for (let i = 0; i < SLUG_ATTEMPTS; i++) {
      try {
        const org = await this.prisma.organization.create({ data: { slug, name: input.name, description: input.description ?? null, owner_id: user.id } })
        return this.toView(org, user.id)
      } catch (e) {
        if (!uniqueTargets(e).includes('slug')) throw e
        slug = `${slugify(input.name)}-${shortId()}`
      }
    }
    throw orgErrors.createFailed()
  }

  async detail(orgId: string, userId: string): Promise<OrgView> {
    const org = await this.prisma.organization.findFirst({ where: { id: orgId, deleted_at: null } })
    if (!org) throw orgErrors.notFound()
    return this.toView(org, userId)
  }

  private async toView(o: Organization, userId: string): Promise<OrgView> {
    return {
      id: o.id,
      slug: o.slug,
      name: o.name,
      description: o.description,
      logoUrl: o.logo_url ? await this.s3.presignDownload(o.logo_url) : null,
      verified: o.verified,
      ownerId: o.owner_id,
      isOwner: o.owner_id === userId,
      createdAt: o.created_at.toISOString(),
    }
  }
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || 'org'
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
