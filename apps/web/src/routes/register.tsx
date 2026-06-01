import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { AuthCard } from '@/components/auth/auth-card'
import { TextField } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useRegister } from '@/features/auth/auth.hooks'
import { registerSchema, type RegisterForm } from '@/features/auth/auth.schemas'
import { m } from '@/i18n/paraglide/messages'

export function RegisterPage() {
  const signup = useRegister()
  const { register, handleSubmit, formState } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = (values: RegisterForm) => signup.mutate(values)
  const serverError = resolveError(signup.error)

  return (
    <AuthCard title="SNIO" subtitle={m.auth_register_title()} footerText={m.auth_have_account()} footerLinkLabel={m.profile_login()} footerLinkTo="/login">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label={m.auth_display_name()} autoComplete="nickname" error={formState.errors.displayName?.message} {...register('displayName')} />
        <TextField label={m.auth_email()} type="email" autoComplete="email" error={formState.errors.email?.message} {...register('email')} />
        <TextField label={m.auth_password()} type="password" autoComplete="new-password" error={formState.errors.password?.message} {...register('password')} />
        {serverError && <span className="text-sm text-destructive">{serverError}</span>}
        <Button type="submit" loading={signup.isPending} className="mt-2">
          {m.auth_register_action()}
        </Button>
      </form>
    </AuthCard>
  )
}

function resolveError(error: unknown): string | null {
  if (!error) return null
  if (isAxiosError(error) && error.response?.status === 409) return m.auth_error_email_taken()
  return m.auth_error_generic()
}
