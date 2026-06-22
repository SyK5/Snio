import { useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGamepad } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Table, type TableColumn } from '@/components/ui/table'
import { useGames } from '@/features/game/game.hooks'
import type { GameView } from '@/features/game/game.types'
import { AdminPanel } from './admin-panel'
import { GameModal } from './game-modal'
import { m } from '@/i18n/paraglide/messages'

export function AdminGames() {
  const { data: games, isLoading } = useGames()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<GameView | null>(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return games ?? []
    return (games ?? []).filter(g => g.name.toLowerCase().includes(q) || g.slug.includes(q))
  }, [games, query])

  const columns: TableColumn<GameView>[] = [
    {
      key: 'name',
      header: m.admin_game_name(),
      sortAccessor: g => g.name.toLowerCase(),
      cell: game => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
            {game.iconUrl ? <img src={game.iconUrl} alt="" className="h-9 w-9 object-cover" /> : <FontAwesomeIcon icon={faGamepad} className="text-muted-foreground" />}
          </div>
          <span className="truncate font-medium text-foreground">{game.name}</span>
        </div>
      ),
    },
    { key: 'slug', header: m.admin_game_slug(), sortAccessor: g => g.slug, cell: game => <span className="text-muted-foreground">{game.slug}</span> },
  ]

  return (
    <AdminPanel
      title={m.admin_games_title()}
      subtitle={m.admin_games_subtitle()}
      actions={
        <Button size="sm" onClick={() => setAdding(true)}>
          {m.admin_game_add()}
        </Button>
      }
      toolbar={<SearchInput value={query} onChange={setQuery} placeholder={m.admin_games_search()} className="w-full max-w-xs" />}
    >
      <Table
        columns={columns}
        rows={filtered}
        rowKey={g => g.id}
        onRowClick={setEditing}
        isLoading={isLoading}
        empty={m.admin_games_empty()}
        pageSize={10}
        defaultSort={{ key: 'name', dir: 'asc' }}
      />

      <GameModal open={adding} game={null} onClose={() => setAdding(false)} />
      {editing && <GameModal open={!!editing} game={editing} onClose={() => setEditing(null)} />}
    </AdminPanel>
  )
}
