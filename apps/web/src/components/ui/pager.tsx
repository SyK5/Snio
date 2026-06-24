interface PagerProps {
  page: number
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}

const navBtn =
  'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30'

export function Pager({ page, hasPrev, hasNext, onPrev, onNext }: PagerProps) {
  if (!hasPrev && !hasNext) return null
  return (
    <div className="mt-6 flex items-center justify-end gap-1">
      <button onClick={onPrev} disabled={!hasPrev} className={navBtn}>
        ‹
      </button>
      <span className="min-w-[2rem] text-center text-xs font-semibold text-highlight tabular-nums">{page}</span>
      <button onClick={onNext} disabled={!hasNext} className={navBtn}>
        ›
      </button>
    </div>
  )
}
