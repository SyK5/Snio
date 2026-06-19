import { useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGamepad, faImage } from '@fortawesome/free-solid-svg-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GAME_ICON_TYPES, type GameIconType } from '@/features/game/game.types'
import { m } from '@/i18n/paraglide/messages'

const MAX_BYTES = 5_242_880

export function GameIconField({ currentUrl, onPick }: { currentUrl: string | null; onPick: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const shown = preview ?? currentUrl

  const onFile = (file?: File) => {
    if (!file) return
    if (!GAME_ICON_TYPES.includes(file.type as GameIconType)) return toast.error(m.avatar_error_type())
    if (file.size > MAX_BYTES) return toast.error(m.avatar_error_size())
    setPreview(URL.createObjectURL(file))
    onPick(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{m.admin_game_icon()}</span>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-muted">
          {shown ? <img src={shown} alt="" className="h-16 w-16 object-cover" /> : <FontAwesomeIcon icon={faGamepad} className="text-2xl text-muted-foreground" />}
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => inputRef.current?.click()}>
            <FontAwesomeIcon icon={faImage} className="mr-2 w-4" />
            {m.admin_game_icon_pick()}
          </Button>
          <span className="px-3 text-xs text-muted-foreground">{m.avatar_hint()}</span>
        </div>
      </div>
      <input ref={inputRef} type="file" accept={GAME_ICON_TYPES.join(',')} className="hidden" onChange={e => onFile(e.target.files?.[0])} />
    </div>
  )
}
