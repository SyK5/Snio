import { useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser, faCamera, faTrash } from '@fortawesome/free-solid-svg-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AVATAR_TYPES, type AvatarType } from './user.types'
import { useProfile, useUploadAvatar, useRemoveAvatar } from './user.hooks'
import { m } from '@/i18n/paraglide/messages'

const MAX_BYTES = 5_242_880

export function AvatarUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const { data: profile } = useProfile()
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()

  const current = preview ?? profile?.avatarUrl ?? null
  const busy = upload.isPending || remove.isPending

  const pick = () => inputRef.current?.click()

  const onFile = (file?: File) => {
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type as AvatarType)) return toast.error(m.avatar_error_type())
    if (file.size > MAX_BYTES) return toast.error(m.avatar_error_size())

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    upload.mutate(file, {
      onSuccess: () => toast.success(m.avatar_success()),
      onError: () => {
        setPreview(null)
        toast.error(m.avatar_error_generic())
      },
      onSettled: () => URL.revokeObjectURL(objectUrl),
    })
  }

  const onRemove = () =>
    remove.mutate(undefined, {
      onSuccess: () => {
        setPreview(null)
        toast.success(m.avatar_removed())
      },
      onError: () => toast.error(m.avatar_error_generic()),
    })

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-20 w-20 shrink-0">
        {current ? (
          <img src={current} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-border" />
        ) : (
          <FontAwesomeIcon icon={faCircleUser} className="text-[5rem] leading-none text-muted-foreground" />
        )}
        {busy && <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 text-xs text-foreground">…</div>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={pick} disabled={busy}>
            <FontAwesomeIcon icon={faCamera} className="mr-2 w-4" />
            {m.avatar_change()}
          </Button>
          {profile?.avatarUrl && (
            <Button size="sm" variant="danger" onClick={onRemove} disabled={busy}>
              <FontAwesomeIcon icon={faTrash} className="mr-2 w-4" />
              {m.avatar_remove()}
            </Button>
          )}
        </div>
        <span className="px-3 text-xs text-muted-foreground">{m.avatar_hint()}</span>
      </div>

      <input ref={inputRef} type="file" accept={AVATAR_TYPES.join(',')} className="hidden" onChange={e => onFile(e.target.files?.[0])} />
    </div>
  )
}
