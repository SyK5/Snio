import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '../../common/guards/auth.guard'
import { PendingFieldsGuard } from '../../common/guards/pending-fields.guard'
import { ClanContextGuard } from '../../common/rls/clan-context.guard'
import { PermissionGuard } from '../../common/rls/permission.guard'
import { RequireGrant } from '../../common/rls/require-grant.decorator'
import { Action } from '../../common/rls/actions'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { AuditService } from './audit.service'
import { AuditLogPage, AuditLogQuery, auditLogQuerySchema } from './audit.dto'

@ApiTags('audit')
@Controller('clans/:clanId/audit-log')
@UseGuards(AuthGuard, PendingFieldsGuard, ClanContextGuard, PermissionGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @RequireGrant('audit_log', Action.READ)
  list(@Param('clanId') clanId: string, @Query(new ZodValidationPipe(auditLogQuerySchema)) query: AuditLogQuery): Promise<AuditLogPage> {
    return this.audit.list(clanId, query.cursor, query.limit, query.category)
  }
}
