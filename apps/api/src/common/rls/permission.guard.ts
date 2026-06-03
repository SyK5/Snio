import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PermissionService } from './permission.service'
import { GrantRequirement, REQUIRE_GRANT } from './require-grant.decorator'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = this.reflector.getAllAndOverride<GrantRequirement | undefined>(REQUIRE_GRANT, [context.getHandler(), context.getClass()])
    if (!req) return true
    if (this.permissions.can(req.grant, req.action)) return true
    throw new ForbiddenException(`Keine Berechtigung: ${req.grant}`)
  }
}
