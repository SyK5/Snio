import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { m } from '@/i18n/paraglide/messages'

export function AuthRequired({ title }: { title: string }) {
  const location = useLocation()
  const redirect = encodeURIComponent(location.pathname + location.search)

  return (
    <div className="flex min-h-screen select-none flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <FontAwesomeIcon icon={faLock} className="text-2xl" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-foreground">{m.auth_required_title()}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{m.auth_required_hint({ title })}</p>
      </div>
      <Link to={`/login?redirect=${redirect}`}>
        <Button size="sm">{m.profile_login()}</Button>
      </Link>
    </div>
  )
}
