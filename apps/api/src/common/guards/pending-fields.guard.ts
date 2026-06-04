import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { currentStore } from '../context/request-context'
import { ALLOW_PENDING } from '../decorators/allow-pending.decorator'

@Injectable()
export class PendingFieldsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const store = currentStore()
    const pending = store?.pendingFields ?? []
    if (pending.length === 0) return true

    const allowed = this.reflector.getAllAndOverride<boolean | undefined>(ALLOW_PENDING, [context.getHandler(), context.getClass()])
    if (allowed) return true

    throw new ForbiddenException({ message: 'Profil unvollständig', pendingFields: pending })
  }
}
