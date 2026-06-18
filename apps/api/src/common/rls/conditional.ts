import { PrismaClient } from '@prisma/client'
import { RequestStore } from '../context/request-context'
import { Rule, CreateRule, CreateRow, resolveWhere, resolveCreate, selfRow, publicVisible, registered, confirmedPublic, myOrganizer, organizerCreate } from './conditional.kit'

interface Conditional {
  read: Rule[]
  create?: CreateRule
}

const CONDITIONAL: Record<string, Conditional> = {
  Event: { read: [publicVisible, registered, myOrganizer()], create: organizerCreate },
  EventParticipation: { read: [selfRow, confirmedPublic, myOrganizer('event')] },
  EventInvite: { read: [myOrganizer('event')] }
}

export const conditionalWhere = (base: PrismaClient, store: RequestStore, model: string) => resolveWhere(CONDITIONAL[model]?.read, base, store, model)
export const conditionalCreate = (base: PrismaClient, store: RequestStore, model: string, rows: CreateRow[]) => resolveCreate(CONDITIONAL[model]?.create, base, store, rows)
