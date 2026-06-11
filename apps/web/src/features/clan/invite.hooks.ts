import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/auth.store'
import { inviteApi } from './invite.api'
import type { ClanDetail, CreateLinkPayload, CreateTargetedPayload, InviteView } from './clan.types'

const invitesKey = (clanId: string) => ['clan', clanId, 'invites'] as const
const previewKey = (code: string) => ['invite', code] as const

export function useInvites(clanId: string, enabled: boolean) {
  return useQuery({ queryKey: invitesKey(clanId), queryFn: () => inviteApi.list(clanId), enabled: enabled && !!clanId })
}

export function useCreateLink(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLinkPayload) => inviteApi.createLink(clanId, payload),
    onSuccess: invite => prependInvite(qc, clanId, invite),
  })
}

export function useCreateTargeted(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTargetedPayload) => inviteApi.createTargeted(clanId, payload),
    onSuccess: invite => prependInvite(qc, clanId, invite),
  })
}

export function useRevokeInvite(clanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => inviteApi.revoke(clanId, inviteId),
    onSuccess: (_data, inviteId) => qc.setQueryData<InviteView[]>(invitesKey(clanId), prev => prev?.filter(i => i.id !== inviteId) ?? prev),
  })
}

export function useInvitePreview(code: string) {
  return useQuery({ queryKey: previewKey(code), queryFn: () => inviteApi.preview(code), enabled: !!code, retry: false })
}

export function useRedeemInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => inviteApi.redeem(code),
    onSuccess: (clan: ClanDetail) => {
      qc.setQueryData(['clan', clan.id], clan)
      qc.invalidateQueries({ queryKey: ['clans'] })
    },
  })
}

function prependInvite(qc: ReturnType<typeof useQueryClient>, clanId: string, invite: InviteView) {
  qc.setQueryData<InviteView[]>(invitesKey(clanId), prev => [invite, ...(prev ?? [])])
}
