import { Link } from 'react-router-dom'
import { m } from '@/i18n/paraglide/messages'

export function VerifyEmailSentPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
      <h1 className="text-2xl font-bold">{m.verify_sent_title()}</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">{m.verify_sent_body()}</p>
      <Link to="/login" className="text-sm font-medium text-primary hover:opacity-80">
        {m.verify_sent_to_login()}
      </Link>
    </main>
  )
}
