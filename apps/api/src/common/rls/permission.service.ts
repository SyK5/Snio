import { Injectable } from '@nestjs/common'
import { currentStore } from '../context/request-context'
import { Action, hasAction } from './actions'

@Injectable()
export class PermissionService {
  can(grant: string, action: Action): boolean {
    const store = currentStore()
    if (!store) return false
    if (store.system || store.isPlatformAdmin || store.isClanOwner) return true
    return hasAction(store.grants?.[grant] ?? 0, action)
  }
}
