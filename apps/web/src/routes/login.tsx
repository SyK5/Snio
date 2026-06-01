import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { AuthCard } from '@/components/auth/auth-card'
import { TextField } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useLogin } from '@/features/auth/auth.hooks'
import { loginSchema, type LoginForm } from '@/features/auth/auth.schemas'
import { m } from '@/i18n/paraglide/messages'

export function LoginPage() {
  const login = useLogin()
  const { register, handleSubmit, formState } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = (values: LoginForm) => login.mutate(values)
  const serverError = resolveError(login.error)

  return (
    <AuthCard title="SNIO" subtitle={m.auth_login_title()} footerText={m.auth_no_account()} footerLinkLabel={m.profile_register()} footerLinkTo="/register">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label={m.auth_email()} type="email" autoComplete="email" error={formState.errors.email?.message} {...register('email')} />
        <TextField label={m.auth_password()} type="password" autoComplete="current-password" error={formState.errors.password?.message} {...register('password')} />
        {serverError && <span className="text-sm text-destructive">{serverError}</span>}
        <Button type="submit" loading={login.isPending} className="mt-2">
          {m.auth_login_action()}
        </Button>
      </form>
    </AuthCard>
  )
}

function resolveError(error: unknown): string | null {
  if (!error) return null
  if (isAxiosError(error) && error.response?.status === 401) return m.auth_error_invalid_credentials()
  return m.auth_error_generic()
}
