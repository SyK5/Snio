import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute inset-y-0 left-3 my-auto h-3.5 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-surface py-2 pl-9 pr-9 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-ring"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex w-9 cursor-pointer items-center justify-center text-muted-foreground transition hover:text-foreground"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
    </div>
  )
}
