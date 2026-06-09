import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'
import { ROLE_COLORS } from './role-meta'

const HEX = /^#[0-9a-fA-F]{6}$/

export function ColorPicker({ value, onChange, disabled }: { value: string | null; onChange: (color: string | null) => void; disabled?: boolean }) {
  const current = value ?? ''
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{m.clan_role_color()}</span>
      <div className="flex flex-wrap items-center gap-2">
        {ROLE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => onChange(c)}
            aria-label={c}
            className={cn('h-7 w-7 cursor-pointer rounded-full border-2 transition disabled:cursor-not-allowed disabled:opacity-40', current.toLowerCase() === c ? 'border-foreground' : 'border-transparent')}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="h-8 w-8 shrink-0 rounded-lg border border-border" style={{ backgroundColor: HEX.test(current) ? current : 'transparent' }} />
        <input
          value={current}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="#171afd"
          maxLength={7}
          aria-label={m.clan_role_color_hex()}
          className="w-32 rounded-lg border border-input bg-surface px-3 py-1.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
      </div>
    </div>
  )
}
