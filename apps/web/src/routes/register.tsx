import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { AuthCard } from '@/components/auth/auth-card'
import { TextField, PasswordField } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useRegister } from '@/features/auth/auth.hooks'
import { authApi } from '@/features/auth/auth.api'
import { registerSchema, usernameField, type RegisterForm } from '@/features/auth/auth.schemas'
import { m } from '@/i18n/paraglide/messages'

export function RegisterPage() {
  const signup = useRegister()
  const { register, handleSubmit, watch, formState } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), mode: 'onTouched' })

  const username = watch('username')
  const taken = useUsernameTaken(username)

  const onSubmit = (values: RegisterForm) => signup.mutate(values)
  const serverError = resolveError(signup.error)
  const usernameError = formState.errors.username?.message ?? (taken ? m.auth_error_username_taken() : undefined)

  return (
    <AuthCard title="SNIO" subtitle={m.auth_register_title()} footerText={m.auth_have_account()} footerLinkLabel={m.profile_login()} footerLinkTo="/login">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label={m.auth_display_name()} autoComplete="nickname" error={formState.errors.displayName?.message} {...register('displayName')} />
        <TextField label={m.auth_username()} autoComplete="username" error={usernameError} {...register('username')} />
        <TextField label={m.auth_email()} type="email" autoComplete="email" error={formState.errors.email?.message} {...register('email')} />
        <PasswordField label={m.auth_password()} autoComplete="new-password" error={formState.errors.password?.message} {...register('password')} />
        {serverError && <span className="text-sm text-destructive">{serverError}</span>}
        <Button type="submit" loading={signup.isPending} disabled={taken} className="mt-2">
          {m.auth_register_action()}
        </Button>
      </form>
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
  if (isAxiosError(error) && error.response?.status === 409) return m.auth_error_register_conflict()
  return m.auth_error_generic()
}
