import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { AuthCard } from '@/components/auth/auth-card'
import { TextField } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { authApi } from '@/features/auth/auth.api'
import { useUpdateProfile } from '@/features/user/user.hooks'
import { usernameField } from '@/features/auth/auth.schemas'
import { m } from '@/i18n/paraglide/messages'

const usernameOnlySchema = z.object({ username: usernameField })
type UsernameForm = z.infer<typeof usernameOnlySchema>

export function CompleteProfilePage({ pendingFields }: { pendingFields: string[] }) {
  if (pendingFields.includes('username')) return <CompleteUsername />
  return <CompleteUnknown />
}

function CompleteUsername() {
  const update = useUpdateProfile()
  const { register, handleSubmit, watch, formState } = useForm<UsernameForm>({ resolver: zodResolver(usernameOnlySchema), mode: 'onTouched' })

  const username = watch('username')
  const taken = useUsernameTaken(username)

  const onSubmit = (values: UsernameForm) => update.mutate(values)
  const serverError = resolveError(update.error)
  const usernameError = formState.errors.username?.message ?? (taken ? m.auth_error_username_taken() : undefined)

  return (
    <AuthCard title="SNIO" subtitle={m.complete_username_title()}>
      <p className="text-sm text-muted-foreground">{m.complete_username_body()}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4" noValidate>
        <TextField label={m.auth_username()} autoComplete="username" error={usernameError} {...register('username')} />
        {serverError && <span className="text-sm text-destructive">{serverError}</span>}
        <Button type="submit" loading={update.isPending} disabled={taken} className="mt-2">
          {m.complete_save_action()}
        </Button>
      </form>
    </AuthCard>
  )
}

function CompleteUnknown() {
  return (
    <AuthCard title="SNIO" subtitle={m.complete_generic_title()}>
      <p className="text-sm text-muted-foreground">{m.complete_generic_body()}</p>
    </AuthCard>
  )
}

function useUsernameTaken(value: string | undefined): boolean {
  const [taken, setTaken] = useState(false)
  useEffect(() => {
    setTaken(false)
    if (!usernameField.safeParse(value).success) return
    const handle = setTimeout(() => {
      authApi
        .usernameAvailable(value as string)
        .then(available => setTaken(!available))
        .catch(() => setTaken(false))
    }, 400)
    return () => clearTimeout(handle)
  }, [value])
  return taken
}

function resolveError(error: unknown): string | null {
  if (!error) return null
  if (isAxiosError(error) && error.response?.status === 409) return m.auth_error_username_taken()
  return m.auth_error_generic()
}
