import { api } from '@/lib/api'
import type { CreateEventLinkPayload, CreateEventTargetedPayload, EventDetailView, EventInvitePreview, EventInviteView } from './event.types'

export const eventInviteApi = {
  list: (clanId: string, eventId: string) => api.get<EventInviteView[]>(`/clans/${clanId}/events/${eventId}/invites`).then(r => r.data),
  createLink: (clanId: string, eventId: string, payload: CreateEventLinkPayload) =>
    api.post<EventInviteView>(`/clans/${clanId}/events/${eventId}/invites`, payload).then(r => r.data),
  createTargeted: (clanId: string, eventId: string, payload: CreateEventTargetedPayload) =>
    api.post<EventInviteView>(`/clans/${clanId}/events/${eventId}/invites/targeted`, payload).then(r => r.data),
  revoke: (clanId: string, eventId: string, inviteId: string) => api.delete(`/clans/${clanId}/events/${eventId}/invites/${inviteId}`).then(r => r.data),
  preview: (code: string) => api.get<EventInvitePreview>(`/event-invites/${code}`).then(r => r.data),
  redeem: (code: string) => api.post<EventDetailView>(`/event-invites/${code}/redeem`).then(r => r.data),
}
