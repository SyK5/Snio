import { api } from '@/lib/api'
import type { ClanDetail, CreateLinkPayload, CreateTargetedPayload, InvitePreview, InviteView } from './clan.types'

export const inviteApi = {
  list: (clanId: string) => api.get<InviteView[]>(`/clans/${clanId}/invites`).then(r => r.data),
  createLink: (clanId: string, payload: CreateLinkPayload) => api.post<InviteView>(`/clans/${clanId}/invites`, payload).then(r => r.data),
  createTargeted: (clanId: string, payload: CreateTargetedPayload) => api.post<InviteView>(`/clans/${clanId}/invites/targeted`, payload).then(r => r.data),
  revoke: (clanId: string, inviteId: string) => api.delete(`/clans/${clanId}/invites/${inviteId}`).then(r => r.data),
  preview: (code: string) => api.get<InvitePreview>(`/invites/${code}`).then(r => r.data),
  redeem: (code: string) => api.post<ClanDetail>(`/invites/${code}/redeem`).then(r => r.data),
}
