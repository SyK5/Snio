import { AsyncLocalStorage } from 'node:async_hooks'

export interface RequestStore {
  requestId: string
  userId?: string
}

export const requestContext = new AsyncLocalStorage<RequestStore>()

export function currentStore(): RequestStore | undefined {
  return requestContext.getStore()
}

export function currentUserId(): string | undefined {
  return requestContext.getStore()?.userId
}
