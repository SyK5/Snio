import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
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
import {
  AssignRoleInput,
  ClanDetail,
  ClanMemberView,
  ClanPage,
  ClanRoleDetail,
  ClanSummary,
  CreateClanInput,
  CreateRoleInput,
  GrantCatalogEntry,
  ListClansQuery,
  MyClanView,
  ReorderRolesInput,
  RoleTemplateView,
  SetGrantsInput,
  UpdateClanInput,
  UpdateRoleInput,
  assignRoleSchema,
  createClanSchema,
  createRoleSchema,
  listClansSchema,
  reorderRolesSchema,
  setGrantsSchema,
  updateClanSchema,
  updateRoleSchema,
} from './clans.dto'

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

  @Get('mine')
  myClans(@CurrentUser() user: AuthUser): Promise<MyClanView[]> {
    return this.clans.myClans(user.id)
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
  @RequireGrant('clan_role', Action.MANAGE)
  assignRole(@Param('memberId') memberId: string, @Body(new ZodValidationPipe(assignRoleSchema)) dto: AssignRoleInput): Promise<ClanMemberView> {
    return this.clans.assignRole(memberId, dto.roleId)
  }

  @Delete(':clanId/members/:memberId/roles/:roleId')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_role', Action.MANAGE)
  removeRole(@Param('memberId') memberId: string, @Param('roleId') roleId: string): Promise<ClanMemberView> {
    return this.clans.removeRole(memberId, roleId)
  }

  @Get('meta/grants')
  grantCatalog(): GrantCatalogEntry[] {
    return this.clans.grantCatalog()
  }

  @Get('meta/role-templates')
  roleTemplates(): RoleTemplateView[] {
    return this.clans.roleTemplates()
  }

  @Get(':clanId/roles')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_role', Action.READ)
  listRoles(@Param('clanId') _clanId: string): Promise<ClanRoleDetail[]> {
    return this.clans.listRoles()
  }

  @Post(':clanId/roles')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_role', Action.CREATE)
  createRole(@Param('clanId') clanId: string, @Body(new ZodValidationPipe(createRoleSchema)) dto: CreateRoleInput): Promise<ClanRoleDetail> {
    return this.clans.createRole(clanId, dto)
  }

  @Patch(':clanId/roles/reorder')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_role', Action.MANAGE)
  reorderRoles(@Param('clanId') _clanId: string, @Body(new ZodValidationPipe(reorderRolesSchema)) dto: ReorderRolesInput): Promise<ClanRoleDetail[]> {
    return this.clans.reorderRoles(dto.roleIds)
  }

  @Patch(':clanId/roles/:roleId')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_role', Action.UPDATE)
  updateRole(@Param('roleId') roleId: string, @Body(new ZodValidationPipe(updateRoleSchema)) dto: UpdateRoleInput): Promise<ClanRoleDetail> {
    return this.clans.updateRole(roleId, dto)
  }

  @Delete(':clanId/roles/:roleId')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_role', Action.DELETE)
  deleteRole(@Param('roleId') roleId: string): Promise<ClanRoleDetail[]> {
    return this.clans.deleteRole(roleId)
  }

  @Put(':clanId/roles/:roleId/grants')
  @UseGuards(ClanContextGuard, PermissionGuard)
  @RequireGrant('clan_role', Action.MANAGE)
  setRoleGrants(@Param('roleId') roleId: string, @Body(new ZodValidationPipe(setGrantsSchema)) dto: SetGrantsInput): Promise<ClanRoleDetail> {
    return this.clans.setRoleGrants(roleId, dto.grants)
  }
}
