import { api } from '@/lib/api'
import type { ClanDetail, ClanMemberView, ClanSummary, CreateClanPayload, UpdateClanPayload } from './clan.types'

export const clanApi = {
  list: () => api.get<ClanSummary[]>('/clans').then(r => r.data),
  detail: (clanId: string) => api.get<ClanDetail>(`/clans/${clanId}`).then(r => r.data),
  create: (payload: CreateClanPayload) => api.post<ClanDetail>('/clans', payload).then(r => r.data),
  update: (clanId: string, payload: UpdateClanPayload) => api.patch<ClanDetail>(`/clans/${clanId}`, payload).then(r => r.data),
  remove: (clanId: string) => api.delete(`/clans/${clanId}`).then(r => r.data),
  join: (clanId: string) => api.post<ClanDetail>(`/clans/${clanId}/join`).then(r => r.data),
  leave: (clanId: string) => api.post(`/clans/${clanId}/leave`).then(r => r.data),
  members: (clanId: string) => api.get<ClanMemberView[]>(`/clans/${clanId}/members`).then(r => r.data),
  kick: (clanId: string, memberId: string) => api.delete(`/clans/${clanId}/members/${memberId}`).then(r => r.data),
  assignRole: (clanId: string, memberId: string, roleId: string) => api.post<ClanMemberView>(`/clans/${clanId}/members/${memberId}/roles`, { roleId }).then(r => r.data),
  removeRole: (clanId: string, memberId: string, roleId: string) => api.delete<ClanMemberView>(`/clans/${clanId}/members/${memberId}/roles/${roleId}`).then(r => r.data),
}
