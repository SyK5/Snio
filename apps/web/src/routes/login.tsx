import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthCard } from '@/components/auth/auth-card'
import { TextField } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useLogin } from '@/features/auth/auth.hooks'
import { authApi } from '@/features/auth/auth.api'
import { loginSchema, type LoginForm } from '@/features/auth/auth.schemas'
import { m } from '@/i18n/paraglide/messages'

export function LoginPage() {
  const login = useLogin()
  const { register, handleSubmit, formState, getValues } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = (values: LoginForm) =>
    login.mutate(values, {
      onError: error => handleLoginError(error, getValues('email')),
    })

  return (
    <AuthCard title="SNIO" subtitle={m.auth_login_title()} footerText={m.auth_no_account()} footerLinkLabel={m.profile_register()} footerLinkTo="/register">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label={m.auth_email()} type="email" autoComplete="email" error={formState.errors.email?.message} {...register('email')} />
        <TextField label={m.auth_password()} type="password" autoComplete="current-password" error={formState.errors.password?.message} {...register('password')} />
        <Link to="/forgot-password" className="-mt-2 self-end text-xs text-muted-foreground hover:text-foreground">
          {m.auth_forgot_link()}
        </Link>
        <Button type="submit" loading={login.isPending} className="mt-2">
          {m.auth_login_action()}
        </Button>
      </form>
    </AuthCard>
  )
}

function handleLoginError(error: unknown, email: string): void {
  if (isAxiosError(error) && error.response?.status === 403) {
    toast.error(m.auth_error_unverified_title(), {
      description: m.auth_error_unverified_body(),
      action: { label: m.auth_resend_action(), onClick: () => resend(email) },
    })
    return
  }
  if (isAxiosError(error) && error.response?.status === 401) {
    toast.error(m.auth_error_invalid_credentials())
    return
  }
  toast.error(m.auth_error_generic())
}

function resend(email: string): void {
  authApi
    .resendVerification(email)
    .then(() => toast.success(m.auth_resend_success()))
    .catch(() => toast.error(m.auth_error_generic()))
}
