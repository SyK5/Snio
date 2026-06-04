import type { ClanRoleView } from './clan.types'

export function RoleBadge({ role, onRemove, removable }: { role: ClanRoleView; onRemove?: () => void; removable?: boolean }) {
  const color = role.color ?? 'var(--color-muted-foreground)'
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: color, color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {role.name}
      {removable && onRemove && (
        <button onClick={onRemove} className="ml-0.5 cursor-pointer opacity-70 transition hover:opacity-100" aria-label="remove">
          ×
        </button>
      )}
    </span>
  )
}
