import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '../../common/guards/auth.guard'
import { PendingFieldsGuard } from '../../common/guards/pending-fields.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthUser } from '../../common/auth/auth.types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { OrganizationsService } from './organizations.service'
import { CreateOrgInput, OrgView, createOrgSchema } from './organizations.dto'

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(AuthGuard, PendingFieldsGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createOrgSchema)) dto: CreateOrgInput): Promise<OrgView> {
    return this.orgs.create(user, dto)
  }

  @Get(':orgId')
  detail(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string): Promise<OrgView> {
    return this.orgs.detail(orgId, user.id)
  }
}
