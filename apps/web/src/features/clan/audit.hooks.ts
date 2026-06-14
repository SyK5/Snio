import { useInfiniteQuery } from '@tanstack/react-query'
import { auditApi } from './audit.api'

const auditKey = (clanId: string, category: string) => ['clan', clanId, 'audit', category] as const

export function useAuditLog(clanId: string, enabled: boolean, category?: string) {
  return useInfiniteQuery({
    queryKey: auditKey(clanId, category ?? 'all'),
    queryFn: ({ pageParam }) => auditApi.list(clanId, pageParam, category),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
    enabled: enabled && !!clanId,
  })
}
