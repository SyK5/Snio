import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { AuthCard } from '@/components/auth/auth-card'
import { TextField } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useLogin } from '@/features/auth/auth.hooks'
import { loginSchema, type LoginForm } from '@/features/auth/auth.schemas'

export function LoginPage() {
  const login = useLogin()
  const { register, handleSubmit, formState } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = (values: LoginForm) => login.mutate(values)
  const serverError = resolveError(login.error)

  return (
    <AuthCard title="SNIO" subtitle="Melde dich an" footerText="Noch kein Konto?" footerLinkLabel="Registrieren" footerLinkTo="/register">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label="E-Mail" type="email" autoComplete="email" error={formState.errors.email?.message} {...register('email')} />
        <TextField label="Passwort" type="password" autoComplete="current-password" error={formState.errors.password?.message} {...register('password')} />
        {serverError && <span className="text-sm text-red-400">{serverError}</span>}
        <Button type="submit" loading={login.isPending} className="mt-2">
          Anmelden
        </Button>
      </form>
    </AuthCard>
  )
}

function resolveError(error: unknown): string | null {
  if (!error) return null
  if (isAxiosError(error) && error.response?.status === 401) return 'Anmeldedaten ungültig'
  return 'Etwas ist schiefgelaufen, bitte erneut versuchen'
}
