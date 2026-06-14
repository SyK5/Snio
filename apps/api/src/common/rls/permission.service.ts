import { Injectable } from '@nestjs/common'
import { currentStore } from '../context/request-context'
import { Action, ALL_ACTIONS, expand, hasAction } from './actions'

@Injectable()
export class PermissionService {
  can(grant: string, action: Action): boolean {
    const store = currentStore()
    if (!store) return false
    if (store.system || store.isPlatformAdmin || store.isClanOwner) return true
    return hasAction(store.grants?.[grant] ?? 0, action)
  }

  canManageRole(targetPosition: number): boolean {
    const store = currentStore()
    if (!store) return false
    if (store.system || store.isPlatformAdmin || store.isClanOwner) return true
    return (store.clanRolePosition ?? -1) > targetPosition
  }

  positionCeiling(): number {
    const store = currentStore()
    if (!store) return -1
    if (store.system || store.isPlatformAdmin || store.isClanOwner) return Number.MAX_SAFE_INTEGER
    return store.clanRolePosition ?? -1
  }

  effectiveActions(grant: string): number {
    const store = currentStore()
    if (!store) return 0
    if (store.system || store.isPlatformAdmin || store.isClanOwner) return ALL_ACTIONS
    return expand(store.grants?.[grant] ?? 0)
  }
}
