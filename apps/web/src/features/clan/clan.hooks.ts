import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/auth.store'
import { clanApi } from './clan.api'
import type { ClanDetail, ClanMemberView, CreateClanPayload, UpdateClanPayload } from './clan.types'

const LIST_KEY = ['clans'] as const
const detailKey = (clanId: string) => ['clan', clanId] as const
const membersKey = (clanId: string) => ['clan', clanId, 'members'] as const

export function useClans() {
  const accessToken = useAuthStore(s => s.accessToken)
  return useQuery({ queryKey: LIST_KEY, queryFn: clanApi.list, enabled: !!accessToken })
}

export function useClan(clanId: string) {
  return useQuery({ queryKey: detailKey(clanId), queryFn: () => clanApi.detail(clanId), enabled: !!clanId })
}

export function useClanMembers(clanId: string) {
  return useQuery({ queryKey: membersKey(clanId), queryFn: () => clanApi.members(clanId), enabled: !!clanId })
}

export function useCreateClan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateClanPayload) => clanApi.create(payload),
    onSuccess: clan => {
      qc.setQueryData(detailKey(clan.id), clan)
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useUpdateClan(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateClanPayload) => clanApi.update(clanId, payload),
    onSuccess: clan => writeDetail(qc, clan),
  })
}

export function useJoinClan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (clanId: string) => clanApi.join(clanId),
    onSuccess: clan => writeDetail(qc, clan),
  })
}

export function useLeaveClan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (clanId: string) => clanApi.leave(clanId),
    onSuccess: (_data, clanId) => {
      qc.removeQueries({ queryKey: detailKey(clanId) })
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useDeleteClan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (clanId: string) => clanApi.remove(clanId),
    onSuccess: (_data, clanId) => {
      qc.removeQueries({ queryKey: detailKey(clanId) })
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useKickMember(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => clanApi.kick(clanId, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(clanId) }),
  })
}

export function useAssignRole(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) => clanApi.assignRole(clanId, memberId, roleId),
    onSuccess: member => writeMember(qc, clanId, member),
  })
}

export function useRemoveRole(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) => clanApi.removeRole(clanId, memberId, roleId),
    onSuccess: member => writeMember(qc, clanId, member),
  })
}

function writeDetail(qc: ReturnType<typeof useQueryClient>, clan: ClanDetail) {
  qc.setQueryData(detailKey(clan.id), clan)
  qc.invalidateQueries({ queryKey: LIST_KEY })
}

function writeMember(qc: ReturnType<typeof useQueryClient>, clanId: string, member: ClanMemberView) {
  qc.setQueryData<ClanMemberView[]>(membersKey(clanId), prev => prev?.map(m => (m.id === member.id ? member : m)) ?? prev)
}
