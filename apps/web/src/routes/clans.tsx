import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useClans } from '@/features/clan/clan.hooks'
import { m } from '@/i18n/paraglide/messages'
import type { ClanSummary } from '@/features/clan/clan.types'

export function ClansPage() {
  const { data: clans, isLoading } = useClans()

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{m.clan_list_title()}</h1>
        <Link to="/clans/new">
          <Button size="sm">{m.clan_create_action()}</Button>
        </Link>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">{m.clan_loading()}</p>}
      {!isLoading && clans?.length === 0 && <EmptyState />}

      <div className="grid gap-3 sm:grid-cols-2">
        {clans?.map(clan => <ClanCard key={clan.id} clan={clan} />)}
      </div>
    </div>
  )
}

function ClanCard({ clan }: { clan: ClanSummary }) {
  return (
    <Link to={`/clans/${clan.id}`}>
      <Card className="flex items-center gap-4 transition hover:border-primary/50">
        <Logo url={clan.logoUrl} tag={clan.tag} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-foreground">{clan.name}</div>
          <div className="text-xs text-muted-foreground">[{clan.tag}] · {m.clan_member_count({ count: clan.memberCount })}</div>
        </div>
      </Card>
    </Link>
  )
}

function Logo({ url, tag }: { url: string | null; tag: string }) {
  if (url) return <img src={url} alt={tag} className="h-12 w-12 rounded-xl object-cover" />
  return <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-sm font-bold text-muted-foreground">{tag.slice(0, 2)}</div>
}

function EmptyState() {
  return (
    <Card tone="muted" className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-sm text-muted-foreground">{m.clan_empty()}</p>
      <Link to="/clans/new">
        <Button size="sm" variant="ghost">{m.clan_create_action()}</Button>
      </Link>
    </Card>
  )
}
