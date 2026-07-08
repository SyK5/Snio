import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/auth.store'
import { eventApi } from './event.api'
import type { CreateEventPayload, EventDetailView, EventPage, UpdateEventPayload } from './event.types'

const LIST_KEY = ['events'] as const
const listPageKey = (cursor?: string) => ['events', cursor ?? 'first'] as const
const detailKey = (eventId: string) => ['event', eventId] as const

export function useEvents(cursor?: string) {
  const accessToken = useAuthStore(s => s.accessToken)
  return useQuery<EventPage>({ queryKey: listPageKey(cursor), queryFn: () => eventApi.list(cursor), enabled: !!accessToken })
}

export function useEvent(eventId: string) {
  return useQuery({ queryKey: detailKey(eventId), queryFn: () => eventApi.detail(eventId), enabled: !!eventId })
}

export function useRegisterEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => eventApi.register(eventId),
    onSuccess: event => writeDetail(qc, event),
  })
}

export function useLeaveEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => eventApi.leave(eventId),
    onSuccess: (_data, eventId) => {
      qc.invalidateQueries({ queryKey: detailKey(eventId) })
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useCreateClanEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clanId, payload }: { clanId: string; payload: CreateEventPayload }) => eventApi.createClan(clanId, payload),
    onSuccess: event => {
      qc.setQueryData(detailKey(event.id), event)
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useUpdateEvent(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: UpdateEventPayload }) => eventApi.update(clanId, eventId, payload),
    onSuccess: event => writeDetail(qc, event),
  })
}

export function useCancelEvent(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => eventApi.cancel(clanId, eventId),
    onSuccess: (_data, eventId) => {
      qc.removeQueries({ queryKey: detailKey(eventId) })
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useApproveParticipant(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) => eventApi.approve(clanId, eventId, userId),
    onSuccess: event => writeDetail(qc, event),
  })
}

export function useRejectParticipant(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) => eventApi.reject(clanId, eventId, userId),
    onSuccess: event => writeDetail(qc, event),
  })
}

function writeDetail(qc: ReturnType<typeof useQueryClient>, event: EventDetailView) {
  qc.setQueryData(detailKey(event.id), event)
  qc.invalidateQueries({ queryKey: LIST_KEY })
}
