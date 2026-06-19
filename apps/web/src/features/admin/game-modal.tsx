import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { faGamepad } from '@fortawesome/free-solid-svg-icons'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { uploadGameIcon } from '@/features/game/game.api'
import { useCreateGame, useDeleteGame, useUpdateGame } from '@/features/game/game.hooks'
import { resolveGameError } from '@/features/game/game.errors'
import type { GameView } from '@/features/game/game.types'
import { GameIconField } from './game-icon-field'
import { m } from '@/i18n/paraglide/messages'

const gameFormSchema = z.object({ name: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(60, 'Maximal 60 Zeichen') })
type GameForm = z.infer<typeof gameFormSchema>

export function GameModal({ open, game, onClose }: { open: boolean; game: GameView | null; onClose: () => void }) {
  const editing = !!game
  const create = useCreateGame()
  const update = useUpdateGame()
  const remove = useDeleteGame()
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const { register, handleSubmit, reset, formState } = useForm<GameForm>({ resolver: zodResolver(gameFormSchema), mode: 'onTouched', values: { name: game?.name ?? '' } })

  useEffect(() => setIconFile(null), [game, open])

  const busy = create.isPending || update.isPending || uploading

  const submit = handleSubmit(async values => {
    let iconKey: string | undefined
    if (iconFile) {
      setUploading(true)
      try {
        iconKey = await uploadGameIcon(iconFile)
      } catch {
        setUploading(false)
        return toast.error(m.game_error_icon_upload())
      }
      setUploading(false)
    }
    const handlers = {
      onSuccess: () => {
        toast.success(editing ? m.admin_game_updated() : m.admin_game_created())
        reset()
        setIconFile(null)
        onClose()
      },
      onError: (error: unknown) => toast.error(resolveGameError(error)),
    }
    if (editing) update.mutate({ gameId: game!.id, payload: { name: values.name, ...(iconKey ? { iconKey } : {}) } }, handlers)
    else create.mutate({ name: values.name, iconKey }, handlers)
  })

  const onDelete = () =>
    remove.mutate(game!.id, {
      onSuccess: () => {
        toast.success(m.admin_game_deleted())
        onClose()
      },
      onError: error => toast.error(resolveGameError(error)),
    })

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={faGamepad}
      title={editing ? m.admin_game_edit_title() : m.admin_game_add_title()}
      subtitle={m.admin_game_subtitle()}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {m.clan_cancel()}
          </Button>
          <Button onClick={submit} loading={busy}>
            {editing ? m.admin_game_save() : m.admin_game_add()}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={m.admin_game_name()} error={formState.errors.name?.message} maxLength={60} {...register('name')} />
        <GameIconField currentUrl={game?.iconUrl ?? null} onPick={setIconFile} />
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>

      {editing && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{m.admin_game_delete()}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.admin_game_delete_hint()}</p>
          </div>
          <Button variant="danger" size="sm" onClick={onDelete} loading={remove.isPending}>
            {m.admin_game_delete()}
          </Button>
        </div>
      )}
    </Modal>
  )
}
