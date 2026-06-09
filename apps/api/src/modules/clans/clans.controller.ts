import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '../../common/guards/auth.guard'
import { PendingFieldsGuard } from '../../common/guards/pending-fields.guard'
import { ClanContextGuard } from '../../common/rls/clan-context.guard'
import { PermissionGuard } from '../../common/rls/permission.guard'
import { RequireGrant } from '../../common/rls/require-grant.decorator'
import { Action } from '../../common/rls/actions'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthUser } from '../../common/auth/auth.types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { ClansService } from './clans.service'
import { AssignRoleInput, ClanDetail, ClanMemberView, ClanSummary, CreateClanInput, UpdateClanInput, assignRoleSchema, createClanSchema, updateClanSchema } from './clans.dto'

@ApiTags('clans')
@Controller('clans')
@UseGuards(AuthGuard, PendingFieldsGuard)
@ApiBearerAuth()
export class ClansController {
  constructor(private readonly clans: ClansService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createClanSchema)) dto: CreateClanInput): Promise<ClanDetail> {
    return this.clans.create(user, dto)
  }

  @Get()
  list(@Query(new ZodValidationPipe(listClansSchema)) query: ListClansQuery): Promise<ClanPage> {
    return this.clans.list(query)
  }

  @Post(':clanId/join')
  join(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string): Promise<ClanDetail> {
    return this.clans.join(clanId, user)
  }

  @Get(':clanId')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan', Action.READ)
  detail(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string): Promise<ClanDetail> {
    return this.clans.detail(clanId, user.id)
  }

  @Patch(':clanId')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan', Action.UPDATE)
  update(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string, @Body(new ZodValidationPipe(updateClanSchema)) dto: UpdateClanInput): Promise<ClanDetail> {
    return this.clans.update(clanId, user.id, dto)
  }

  @Delete(':clanId')
  @HttpCode(204)
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan', Action.DELETE)
  remove(@Param('clanId') clanId: string): Promise<void> {
    return this.clans.softDelete(clanId)
  }

  @Post(':clanId/leave')
  @HttpCode(204)
  @UseGuards(ClanContextGuard, PermissionGuard)
  leave(@CurrentUser() user: AuthUser, @Param('clanId') clanId: string): Promise<void> {
    return this.clans.leave(clanId, user)
  }

  @Get(':clanId/members')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_member', Action.READ)
  members(@Param('clanId') _clanId: string): Promise<ClanMemberView[]> {
    return this.clans.listMembers()
  }

  @Delete(':clanId/members/:memberId')
  @HttpCode(204)
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_member', Action.DELETE)
  kick(@Param('clanId') clanId: string, @Param('memberId') memberId: string): Promise<void> {
    return this.clans.kick(clanId, memberId)
  }

  @Post(':clanId/members/:memberId/roles')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_member', Action.MANAGE)
  assignRole(@Param('memberId') memberId: string, @Body(new ZodValidationPipe(assignRoleSchema)) dto: AssignRoleInput): Promise<ClanMemberView> {
    return this.clans.assignRole(memberId, dto.roleId)
  }

  @Delete(':clanId/members/:memberId/roles/:roleId')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_member', Action.MANAGE)
  removeRole(@Param('memberId') memberId: string, @Param('roleId') roleId: string): Promise<ClanMemberView> {
    return this.clans.removeRole(memberId, roleId)
  }
}
