import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/auth.store'
import { clanApi } from './clan.api'
import type {
  ClanDetail,
  ClanMemberView,
  ClanPage,
  ClanRoleDetail,
  ClanRoleGrantView,
  ClanSummary,
  CreateClanPayload,
  CreateRolePayload,
  UpdateClanPayload,
  UpdateRolePayload,
} from './clan.types'

const LIST_KEY = ['clans'] as const
const listPageKey = (cursor?: string) => ['clans', cursor ?? 'first'] as const
const detailKey = (clanId: string) => ['clan', clanId] as const
const membersKey = (clanId: string) => ['clan', clanId, 'members'] as const
const rolesKey = (clanId: string) => ['clan', clanId, 'roles'] as const
const grantCatalogKey = ['grant-catalog'] as const
const roleTemplatesKey = ['role-templates'] as const

export function useClans(cursor?: string) {
  const accessToken = useAuthStore(s => s.accessToken)
  return useQuery<ClanPage>({
    queryKey: listPageKey(cursor),
    queryFn: () => clanApi.list(cursor),
    enabled: !!accessToken,
  })
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

export function useGrantCatalog() {
  return useQuery({ queryKey: grantCatalogKey, queryFn: () => clanApi.grantCatalog(), staleTime: Infinity })
}

export function useRoleTemplates() {
  return useQuery({ queryKey: roleTemplatesKey, queryFn: () => clanApi.roleTemplates(), staleTime: Infinity })
}

export function useClanRoles(clanId: string, enabled = true) {
  return useQuery({ queryKey: rolesKey(clanId), queryFn: () => clanApi.listRoles(clanId), enabled: enabled && !!clanId })
}

export function useCreateRole(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => clanApi.createRole(clanId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: rolesKey(clanId) }),
  })
}

export function useUpdateRole(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: UpdateRolePayload }) => clanApi.updateRole(clanId, roleId, payload),
    onSuccess: role => writeRole(qc, clanId, role),
  })
}

export function useDeleteRole(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => clanApi.deleteRole(clanId, roleId),
    onSuccess: roles => qc.setQueryData(rolesKey(clanId), roles),
  })
}

export function useReorderRoles(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleIds: string[]) => clanApi.reorderRoles(clanId, roleIds),
    onSuccess: roles => qc.setQueryData(rolesKey(clanId), roles),
  })
}

export function useSetRoleGrants(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, grants }: { roleId: string; grants: ClanRoleGrantView[] }) => clanApi.setRoleGrants(clanId, roleId, grants),
    onSuccess: role => writeRole(qc, clanId, role),
  })
}

function writeRole(qc: ReturnType<typeof useQueryClient>, clanId: string, role: ClanRoleDetail) {
  qc.setQueryData<ClanRoleDetail[]>(rolesKey(clanId), prev => prev?.map(r => (r.id === role.id ? role : r)) ?? prev)
}
