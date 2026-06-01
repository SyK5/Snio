import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { AuthCard } from '@/components/auth/auth-card'
import { TextField } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useRegister } from '@/features/auth/auth.hooks'
import { registerSchema, type RegisterForm } from '@/features/auth/auth.schemas'

export function RegisterPage() {
  const signup = useRegister()
  const { register, handleSubmit, formState } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = (values: RegisterForm) => signup.mutate(values)
  const serverError = resolveError(signup.error)

  return (
    <AuthCard title="SNIO" subtitle="Erstelle dein Konto" footerText="Bereits registriert?" footerLinkLabel="Anmelden" footerLinkTo="/login">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label="Anzeigename" autoComplete="nickname" error={formState.errors.displayName?.message} {...register('displayName')} />
        <TextField label="E-Mail" type="email" autoComplete="email" error={formState.errors.email?.message} {...register('email')} />
        <TextField label="Passwort" type="password" autoComplete="new-password" error={formState.errors.password?.message} {...register('password')} />
        {serverError && <span className="text-sm text-red-400">{serverError}</span>}
        <Button type="submit" loading={signup.isPending} className="mt-2">
          Registrieren
        </Button>
      </form>
    </AuthCard>
  )
}

function resolveError(error: unknown): string | null {
  if (!error) return null
  if (isAxiosError(error) && error.response?.status === 409) return 'E-Mail bereits vergeben'
  return 'Etwas ist schiefgelaufen, bitte erneut versuchen'
}
