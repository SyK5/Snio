import { useInfiniteQuery } from '@tanstack/react-query'
import { auditApi } from './audit.api'

const auditKey = (clanId: string) => ['clan', clanId, 'audit'] as const

export function useAuditLog(clanId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: auditKey(clanId),
    queryFn: ({ pageParam }) => auditApi.list(clanId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
    enabled: enabled && !!clanId,
  })
}
