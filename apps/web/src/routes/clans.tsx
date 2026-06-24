import { useState } from 'react'
import { faArrowUpRightFromSquare, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { Card } from '@/components/ui/card'
import { EntityCard } from '@/components/ui/entity-card'
import { Avatar } from '@/components/ui/avatar'
import { Pager } from '@/components/ui/pager'
import { Button } from '@/components/ui/button'
import { CreateClanModal } from '@/features/clan/create-clan-modal'
import { ClanDetailModal } from '@/features/clan/clan-detail-modal'
import { InviteManagerModal } from '@/features/clan/invite-manager-modal'
import { useClans } from '@/features/clan/clan.hooks'
import { m } from '@/i18n/paraglide/messages'
import type { ClanSummary } from '@/features/clan/clan.types'

export function ClansPage() {
  const [page, setPage] = useState(1)
  const [stack, setStack] = useState<(string | undefined)[]>([undefined])
  const cursor = stack[stack.length - 1]
  const { data, isLoading } = useClans(cursor)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<ClanSummary | null>(null)
  const [inviting, setInviting] = useState<ClanSummary | null>(null)

  const goNext = () => {
    if (!data?.nextCursor) return
    setStack(s => [...s, data.nextCursor!])
    setPage(p => p + 1)
  }

  const goPrev = () => {
    if (stack.length <= 1) return
    setStack(s => s.slice(0, -1))
    setPage(p => p - 1)
  }

  const clans = data?.items
  const hasPrev = stack.length > 1
  const hasNext = !!data?.nextCursor

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{m.clan_list_title()}</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          {m.clan_create_action()}
        </Button>
      </div>

      {isLoading && <LoadingGrid />}

      {!isLoading && clans?.length === 0 && !hasPrev && <EmptyState onCreate={() => setCreating(true)} />}

      <div className="grid gap-3 sm:grid-cols-2">
        {!isLoading && clans?.map(clan => <ClanCard key={clan.id} clan={clan} onClick={() => setSelected(clan)} onInvite={() => setInviting(clan)} />)}
      </div>

      <Pager page={page} hasPrev={hasPrev} hasNext={hasNext} onPrev={goPrev} onNext={goNext} />

      <CreateClanModal open={creating} onClose={() => setCreating(false)} />

      {selected && <ClanDetailModal clan={selected} open={!!selected} onClose={() => setSelected(null)} />}

      {inviting && <InviteManagerModal clanId={inviting.id} open={!!inviting} onClose={() => setInviting(null)} />}
    </div>
  )
}

function ClanCard({ clan, onClick, onInvite }: { clan: ClanSummary; onClick: () => void; onInvite: () => void }) {
  return (
    <EntityCard
      onClick={onClick}
      contextMenu={[
        { icon: faArrowUpRightFromSquare, label: m.clan_ctx_open_new_tab(), onClick: () => window.open(`/clans/${clan.id}`, '_blank') },
        { icon: faUserPlus, label: m.clan_ctx_invite(), onClick: onInvite },
      ]}
      media={<Avatar src={clan.logoUrl} fallback={clan.tag.slice(0, 2)} />}
      title={clan.name}
      subtitle={
        <span className="flex items-center gap-1.5">
          <span>[{clan.tag}]</span>
          <span className="h-1 w-1 rounded-full bg-highlight" />
          <span>{m.clan_member_count({ count: clan.memberCount })}</span>
        </span>
      }
    />
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card tone="muted" className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-sm text-muted-foreground">{m.clan_empty()}</p>
      <Button size="sm" variant="ghost" onClick={onCreate}>
        {m.clan_create_action()}
      </Button>
    </Card>
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="flex items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        </Card>
      ))}
    </div>
  )
}
