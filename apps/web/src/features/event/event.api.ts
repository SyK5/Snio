import { api } from '@/lib/api'
import type { CreateEventPayload, EventDetailView, EventPage, UpdateEventPayload } from './event.types'

export const eventApi = {
  list: (cursor?: string, limit = 20) => api.get<EventPage>('/events', { params: { ...(cursor ? { cursor } : {}), limit } }).then(r => r.data),
  detail: (eventId: string) => api.get<EventDetailView>(`/events/${eventId}`).then(r => r.data),
  register: (eventId: string) => api.post<EventDetailView>(`/events/${eventId}/register`).then(r => r.data),
  leave: (eventId: string) => api.delete(`/events/${eventId}/register`).then(r => r.data),
  createClan: (clanId: string, payload: CreateEventPayload) => api.post<EventDetailView>(`/clans/${clanId}/events`, payload).then(r => r.data),
  createOrg: (orgId: string, payload: CreateEventPayload) => api.post<EventDetailView>(`/organizations/${orgId}/events`, payload).then(r => r.data),
  createSystem: (payload: CreateEventPayload) => api.post<EventDetailView>('/events/system', payload).then(r => r.data),
  update: (clanId: string, eventId: string, payload: UpdateEventPayload) => api.patch<EventDetailView>(`/clans/${clanId}/events/${eventId}`, payload).then(r => r.data),
  cancel: (clanId: string, eventId: string) => api.delete(`/clans/${clanId}/events/${eventId}`).then(r => r.data),
  approve: (clanId: string, eventId: string, userId: string) =>
    api.post<EventDetailView>(`/clans/${clanId}/events/${eventId}/participants/${userId}/approve`).then(r => r.data),
  reject: (clanId: string, eventId: string, userId: string) => api.delete<EventDetailView>(`/clans/${clanId}/events/${eventId}/participants/${userId}`).then(r => r.data),
}
