import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { ACTIONS, CATEGORY_ORDER, categoryLabel, grantLabel } from './role-meta'
import type { GrantCatalogEntry } from './clan.types'

interface Props {
  catalog: GrantCatalogEntry[]
  value: Record<string, number>
  effective: Record<string, number>
  disabled?: boolean
  onToggle: (grant: string, actions: number) => void
}

export function GrantEditor({ catalog, value, effective, disabled, onToggle }: Props) {
  const groups = CATEGORY_ORDER.map((cat) => ({ cat, items: catalog.filter((g) => g.category === cat) })).filter((g) => g.items.length > 0)

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.cat} className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{categoryLabel(group.cat)}</span>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {group.items.map((g) => (
              <GrantRow key={g.key} grant={g} actions={value[g.key] ?? 0} own={effective[g.key] ?? 0} disabled={disabled} onToggle={onToggle} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function GrantRow({ grant, actions, own, disabled, onToggle }: { grant: GrantCatalogEntry; actions: number; own: number; disabled?: boolean; onToggle: (grant: string, actions: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="text-sm text-foreground">{grantLabel(grant.key)}</span>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {ACTIONS.filter((a) => (grant.actions & a.bit) === a.bit).map((a) => {
          const active = (actions & a.bit) === a.bit
          const blocked = disabled || (own & a.bit) !== a.bit
          return (
            <button
              key={a.bit}
              type="button"
              disabled={blocked}
              onClick={() => onToggle(grant.key, active ? actions & ~a.bit : actions | a.bit)}
              className={cn('flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-40', active ? 'border-highlight bg-highlight/10 text-highlight' : 'border-border text-muted-foreground hover:text-foreground')}
            >
              {active && <FontAwesomeIcon icon={faCheck} className="text-[0.6rem]" />}
              {a.label()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
