import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { Card } from '@/components/ui/card'
import { m } from '@/i18n/paraglide/messages'

interface AuthCardProps {
  title: string
  subtitle: string
  children: ReactNode
  footerText?: string
  footerLinkLabel?: string
  footerLinkTo?: string
}

export function AuthCard({ title, subtitle, children, footerText, footerLinkLabel, footerLinkTo }: AuthCardProps) {
  const navigate = useNavigate()
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Card padding="lg" className="relative w-full max-w-sm">
        <button
          onClick={goBack}
          title={m.auth_back()}
          className="absolute left-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/Snio.png" alt="Snio" className="h-14 w-14 object-contain" style={{ borderRadius: 16 }} />
          <h1 className="text-2xl font-black italic tracking-tight">{title}</h1>
          <p className="text-center text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
        {footerText && footerLinkLabel && footerLinkTo && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {footerText}{' '}
            <Link to={footerLinkTo} className="font-medium text-primary hover:opacity-80">
              {footerLinkLabel}
            </Link>
          </p>
        )}
      </Card>
    </main>
  )
}
