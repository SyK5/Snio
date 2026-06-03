import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthCard } from '@/components/auth/auth-card'
import { TextField } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useForgotPassword } from '@/features/auth/auth.hooks'
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/features/auth/auth.schemas'
import { m } from '@/i18n/paraglide/messages'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const forgot = useForgotPassword()
  const { register, handleSubmit, formState } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = (values: ForgotPasswordForm) => forgot.mutate(values.email, { onSuccess: () => setSent(true) })

  return (
    <AuthCard title="SNIO" subtitle={m.auth_forgot_title()} footerText={m.auth_remember()} footerLinkLabel={m.auth_login_action()} footerLinkTo="/login">
      {sent ? (
        <p className="text-center text-sm text-muted-foreground">{m.auth_forgot_sent()}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <TextField label={m.auth_email()} type="email" autoComplete="email" error={formState.errors.email?.message} {...register('email')} />
          <Button type="submit" loading={forgot.isPending} className="mt-2">
            {m.auth_forgot_action()}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
