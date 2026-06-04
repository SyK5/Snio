import { PrismaClient } from '@prisma/client'
import { rlsExtension } from '../rls/rls.extension'

export const RLS_PRISMA = Symbol('RLS_PRISMA')

export function createRlsClient(base: PrismaClient) {
  return base.$extends(rlsExtension(base))
}

export type RlsPrismaClient = ReturnType<typeof createRlsClient>

export type RlsTransactionClient = Omit<RlsPrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
