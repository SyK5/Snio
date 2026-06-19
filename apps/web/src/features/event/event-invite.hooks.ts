import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { eventInviteApi } from './event-invite.api'
import type { CreateEventLinkPayload, CreateEventTargetedPayload, EventDetailView, EventInviteView } from './event.types'

const invitesKey = (eventId: string) => ['event', eventId, 'invites'] as const
const previewKey = (code: string) => ['event-invite', code] as const

export function useEventInvites(clanId: string, eventId: string, enabled: boolean) {
  return useQuery({ queryKey: invitesKey(eventId), queryFn: () => eventInviteApi.list(clanId, eventId), enabled: enabled && !!clanId && !!eventId })
}

export function useCreateEventLink(clanId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEventLinkPayload) => eventInviteApi.createLink(clanId, eventId, payload),
    onSuccess: invite => prependInvite(qc, eventId, invite),
  })
}

export function useCreateEventTargeted(clanId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEventTargetedPayload) => eventInviteApi.createTargeted(clanId, eventId, payload),
    onSuccess: invite => prependInvite(qc, eventId, invite),
  })
}

export function useRevokeEventInvite(clanId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => eventInviteApi.revoke(clanId, eventId, inviteId),
    onSuccess: (_data, inviteId) => qc.setQueryData<EventInviteView[]>(invitesKey(eventId), prev => prev?.filter(i => i.id !== inviteId) ?? prev),
  })
}

export function useEventInvitePreview(code: string) {
  return useQuery({ queryKey: previewKey(code), queryFn: () => eventInviteApi.preview(code), enabled: !!code, retry: false })
}

export function useRedeemEventInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => eventInviteApi.redeem(code),
    onSuccess: (event: EventDetailView) => {
      qc.setQueryData(['event', event.id], event)
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

function prependInvite(qc: ReturnType<typeof useQueryClient>, eventId: string, invite: EventInviteView) {
  qc.setQueryData<EventInviteView[]>(invitesKey(eventId), prev => [invite, ...(prev ?? [])])
}
