import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateClanModal } from '@/features/clan/create-clan-modal'
import { ClanDetailModal } from '@/features/clan/clan-detail-modal'
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
        <Button size="sm" onClick={() => setCreating(true)}>{m.clan_create_action()}</Button>
      </div>

      {isLoading && <LoadingGrid />}

      {!isLoading && clans?.length === 0 && !hasPrev && (
        <EmptyState onCreate={() => setCreating(true)} />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {!isLoading && clans?.map(clan => (
          <ClanCard key={clan.id} clan={clan} onClick={() => setSelected(clan)} />
        ))}
      </div>

      {(hasPrev || hasNext) && (
        <div className="mt-6 flex items-center justify-end gap-1">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            ‹
          </button>
          <span className="min-w-[2rem] text-center text-xs font-semibold text-highlight tabular-nums">{page}</span>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}

      <CreateClanModal open={creating} onClose={() => setCreating(false)} />

      {selected && (
        <ClanDetailModal clan={selected} open={!!selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function ClanCard({ clan, onClick }: { clan: ClanSummary; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group w-full text-left">
      <Card className="flex cursor-pointer items-center gap-4 transition light:shadow-sm hover:border-highlight/60 hover:shadow-[0_0_0_1px_var(--highlight)] active:scale-[0.99]">
        <Logo url={clan.logoUrl} tag={clan.tag} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-foreground">{clan.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>[{clan.tag}]</span>
            <span className="h-1 w-1 rounded-full bg-highlight" />
            <span>{m.clan_member_count({ count: clan.memberCount })}</span>
          </div>
        </div>
      </Card>
    </button>
  )
}

function Logo({ url, tag }: { url: string | null; tag: string }) {
  if (url) return <img src={url} alt={tag} className="h-12 w-12 rounded-xl object-cover" />
  return <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-sm font-bold text-muted-foreground">{tag.slice(0, 2)}</div>
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card tone="muted" className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-sm text-muted-foreground">{m.clan_empty()}</p>
      <Button size="sm" variant="ghost" onClick={onCreate}>{m.clan_create_action()}</Button>
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
