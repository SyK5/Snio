import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGamepad } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { Table, type TableColumn } from '@/components/ui/table'
import { useGames } from '@/features/game/game.hooks'
import type { GameView } from '@/features/game/game.types'
import { GameModal } from './game-modal'
import { m } from '@/i18n/paraglide/messages'

export function AdminGames() {
  const { data: games, isLoading } = useGames()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<GameView | null>(null)

  const columns: TableColumn<GameView>[] = [
    {
      key: 'game',
      header: m.admin_game_name(),
      cell: game => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
            {game.iconUrl ? <img src={game.iconUrl} alt="" className="h-9 w-9 object-cover" /> : <FontAwesomeIcon icon={faGamepad} className="text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{game.name}</div>
            <div className="truncate text-xs text-muted-foreground">{game.slug}</div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{m.admin_games_title()}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{m.admin_games_subtitle()}</p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>
          {m.admin_game_add()}
        </Button>
      </div>

      <Table columns={columns} rows={games ?? []} rowKey={g => g.id} onRowClick={setEditing} isLoading={isLoading} empty={m.admin_games_empty()} />

      <GameModal open={adding} game={null} onClose={() => setAdding(false)} />
      {editing && <GameModal open={!!editing} game={editing} onClose={() => setEditing(null)} />}
    </section>
  )
}
