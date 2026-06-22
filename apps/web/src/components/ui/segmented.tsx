import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { cn } from '@/lib/utils'

interface SegmentedOption<T extends string> {
  value: T
  label?: string
  icon?: IconDefinition
  title?: string
}

interface SegmentedProps<T extends string> {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="inline-flex gap-1 rounded-xl border border-border bg-surface-muted p-1">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          title={option.title ?? option.label}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition',
            value === option.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.icon && <FontAwesomeIcon icon={option.icon} className="w-3.5" />}
          {option.label}
        </button>
      ))}
    </div>
  )
}
