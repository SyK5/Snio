import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleXmark, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { useVerifyEmail } from '@/features/auth/auth.hooks'
import { m } from '@/i18n/paraglide/messages'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const verify = useVerifyEmail()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || !token) return
    fired.current = true
    verify.mutate(token)
  }, [token, verify])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
      <img src="/Snio.png" alt="Snio" className="h-14 w-14 object-contain" style={{ borderRadius: 16 }} />
      <State token={token} pending={verify.isPending} success={verify.isSuccess} error={verify.isError} />
    </main>
  )
}

function State({ token, pending, success, error }: { token: string | null; pending: boolean; success: boolean; error: boolean }) {
  if (!token) return <Result icon={faCircleXmark} tone="text-destructive" title={m.verify_invalid_title()} body={m.verify_invalid_body()} />
  if (pending) return <Result icon={faSpinner} tone="text-muted-foreground animate-spin" title={m.verify_pending_title()} />
  if (success)
    return (
      <Result icon={faCircleCheck} tone="text-primary" title={m.verify_success_title()} body={m.verify_success_body()}>
        <Link to="/login">
          <Button className="mt-2">{m.verify_to_login()}</Button>
        </Link>
      </Result>
    )
  if (error) return <Result icon={faCircleXmark} tone="text-destructive" title={m.verify_invalid_title()} body={m.verify_invalid_body()} />
  return null
}

function Result({ icon, tone, title, body, children }: { icon: typeof faCircleCheck; tone: string; title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <FontAwesomeIcon icon={icon} className={`text-4xl ${tone}`} />
      <h1 className="text-2xl font-bold">{title}</h1>
      {body && <p className="max-w-md text-sm text-muted-foreground">{body}</p>}
      {children}
    </div>
  )
}
