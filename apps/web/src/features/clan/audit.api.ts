import { api } from '@/lib/api'
import type { AuditLogPage } from './clan.types'

export const auditApi = {
  list: (clanId: string, cursor?: string) => api.get<AuditLogPage>(`/clans/${clanId}/audit-log`, { params: cursor ? { cursor } : {} }).then(r => r.data),
}
