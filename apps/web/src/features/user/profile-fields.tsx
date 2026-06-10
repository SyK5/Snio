import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { TextField } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { authApi } from '@/features/auth/auth.api'
import { usernameField } from '@/features/auth/auth.schemas'
import { useProfile, useUpdateProfile, useUpdateUsername } from './user.hooks'
import { m } from '@/i18n/paraglide/messages'

const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000

export function ProfileFields() {
  const { data: profile } = useProfile()
  if (!profile) return null

  return (
    <div className="flex flex-col gap-6">
      <DisplayNameField current={profile.displayName} discriminator={profile.discriminator} />
      <div className="border-t border-border" />
      <UsernameField current={profile.username} changedAt={profile.usernameChangedAt} />
    </div>
  )
}

function DisplayNameField({ current, discriminator }: { current: string; discriminator: string }) {
  const [value, setValue] = useState(current)
  const update = useUpdateProfile()

  useEffect(() => setValue(current), [current])

  const dirty = value.trim() !== current && value.trim().length >= 2
  const onSave = () =>
    update.mutate(
      { displayName: value.trim() },
      {
        onSuccess: () => toast.success(m.profile_display_saved()),
        onError: () => toast.error(m.auth_error_generic()),
      },
    )

  return (
    <div className="flex flex-col gap-2">
      <TextField label={m.profile_display_label()} value={value} onChange={e => setValue(e.target.value)} maxLength={40} />
      <p className="text-xs text-muted-foreground">
        {m.profile_display_hint()} {current}#{discriminator}
      </p>
      <Button size="sm" className="self-start" disabled={!dirty} loading={update.isPending} onClick={onSave}>
        {m.profile_save()}
      </Button>
    </div>
  )
}

function UsernameField({ current, changedAt }: { current: string; changedAt: string | null }) {
  const [value, setValue] = useState(current)
  const update = useUpdateUsername()
  const taken = useUsernameTaken(value, current)
  const locked = cooldownUntil(changedAt)

  useEffect(() => setValue(current), [current])

  const valid = usernameField.safeParse(value).success
  const dirty = value !== current && valid && !taken
  const blocked = locked !== null

  const onSave = () =>
    update.mutate(
      { username: value },
      {
        onSuccess: () => toast.success(m.profile_username_saved()),
        onError: error => toast.error(resolveError(error)),
      },
    )

  return (
    <div className="flex flex-col gap-2">
      <TextField label={m.profile_username_label()} value={value} onChange={e => setValue(e.target.value.toLowerCase())} maxLength={20} disabled={blocked} />
      <p className="text-xs text-muted-foreground">
        {m.profile_username_hint()} @{current}
      </p>
      {taken && !blocked && <span className="text-xs text-destructive">{m.auth_error_username_taken()}</span>}
      {blocked && (
        <span className="text-xs text-muted-foreground">
          {m.profile_username_cooldown()} {locked}
        </span>
      )}
      <Button size="sm" className="self-start" disabled={!dirty || blocked} loading={update.isPending} onClick={onSave}>
        {m.profile_save()}
      </Button>
    </div>
  )
}

function cooldownUntil(changedAt: string | null): string | null {
  if (!changedAt) return null
  const next = new Date(changedAt).getTime() + COOLDOWN_MS
  if (Date.now() >= next) return null
  return new Date(next).toLocaleDateString()
}

function useUsernameTaken(value: string, current: string): boolean {
  const [taken, setTaken] = useState(false)
  useEffect(() => {
    setTaken(false)
    if (value === current) return
    if (!usernameField.safeParse(value).success) return
    const handle = setTimeout(() => {
      authApi
        .usernameAvailable(value)
        .then(available => setTaken(!available))
        .catch(() => setTaken(false))
    }, 400)
    return () => clearTimeout(handle)
  }, [value, current])
  return taken
}

function resolveError(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) return m.auth_error_username_taken()
  if (isAxiosError(error) && error.response?.status === 403) return m.profile_username_cooldown_short()
  return m.auth_error_generic()
}
