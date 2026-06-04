import { AsyncLocalStorage } from 'node:async_hooks'

export interface RequestStore {
  requestId: string
  userId?: string
  isPlatformAdmin?: boolean
  pendingFields?: string[]
  system?: boolean
  clanId?: string
  isClanOwner?: boolean
  clanRolePosition?: number
  grants?: Record<string, number>
  membershipClanIds?: string[]
}

export const requestContext = new AsyncLocalStorage<RequestStore>()

export function currentStore(): RequestStore | undefined {
  return requestContext.getStore()
}

export function currentUserId(): string | undefined {
  return requestContext.getStore()?.userId
}

export async function runSystem<T>(fn: () => Promise<T>): Promise<T> {
  const store = requestContext.getStore()
  if (!store) return fn()
  const prev = store.system
  store.system = true
  try {
    return await fn()
  } finally {
    store.system = prev
  }
}
