import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { AuthCard } from '@/components/auth/auth-card'
import { TextField } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useResetPassword } from '@/features/auth/auth.hooks'
import { resetPasswordSchema, type ResetPasswordForm } from '@/features/auth/auth.schemas'
import { m } from '@/i18n/paraglide/messages'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const reset = useResetPassword()
  const { register, handleSubmit, formState } = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordSchema) })

  if (!token)
    return (
      <AuthCard title="SNIO" subtitle={m.auth_reset_title()} footerText={m.auth_remember()} footerLinkLabel={m.auth_login_action()} footerLinkTo="/login">
        <p className="text-center text-sm text-destructive">{m.auth_reset_invalid()}</p>
      </AuthCard>
    )

  const onSubmit = (values: ResetPasswordForm) =>
    reset.mutate(
      { token, password: values.password },
      {
        onSuccess: () => toast.success(m.auth_reset_success()),
        onError: error => toast.error(isAxiosError(error) && error.response?.status === 400 ? m.auth_reset_invalid() : m.auth_error_generic()),
      },
    )

  return (
    <AuthCard title="SNIO" subtitle={m.auth_reset_title()} footerText={m.auth_remember()} footerLinkLabel={m.auth_login_action()} footerLinkTo="/login">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label={m.auth_new_password()} type="password" autoComplete="new-password" error={formState.errors.password?.message} {...register('password')} />
        <TextField label={m.auth_confirm_password()} type="password" autoComplete="new-password" error={formState.errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" loading={reset.isPending} className="mt-2">
          {m.auth_reset_action()}
        </Button>
      </form>
    </AuthCard>
  )
}
