import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/auth.store'
import { m } from '@/i18n/paraglide/messages'

export function HomePage() {
  const isAuthed = useAuthStore(s => !!s.accessToken)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
      <img src="/Snio.png" alt="Snio Logo" className="h-24 w-24 object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.35)]" style={{ borderRadius: 24 }} />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-black italic tracking-tight">SNIO</h1>

        <p className="max-w-md text-center text-sm text-muted-foreground">{m.home_tagline()}</p>
        <p className="loading-text max-w-md text-center text-sm text-muted-foreground">{m.home_status()}</p>
      </div>

      {isAuthed ? (
        <Link to="/clans">
          <Button size="sm">{m.nav_clans()}</Button>
        </Link>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">{m.home_guest_hint()}</p>
          <div className="flex gap-2">
            <Link to="/login">
              <Button size="sm">{m.profile_login()}</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" variant="ghost">
                {m.profile_register()}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
