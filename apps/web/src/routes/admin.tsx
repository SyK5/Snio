import { useState } from 'react'
import { faGamepad } from '@fortawesome/free-solid-svg-icons'
import { Segmented } from '@/components/ui/segmented'
import { AdminGames } from '@/features/admin/admin-games'
import { m } from '@/i18n/paraglide/messages'

type SectionKey = 'games'

export function AdminPage() {
  const [active, setActive] = useState<SectionKey>('games')

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{m.admin_title()}</h1>
        <Segmented value={active} onChange={setActive} options={[{ value: 'games', label: m.admin_games_title(), icon: faGamepad }]} />
      </div>

      {active === 'games' && <AdminGames />}
    </div>
  )
}
