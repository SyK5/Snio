import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'

interface AuthCardProps {
  title: string
  subtitle: string
  children: ReactNode
  footerText: string
  footerLinkLabel: string
  footerLinkTo: string
}

export function AuthCard({ title, subtitle, children, footerText, footerLinkLabel, footerLinkTo }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1120] px-4 text-white">
      <Card padding="lg" className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/Snio.png" alt="Snio" className="h-14 w-14 object-contain" style={{ borderRadius: 16 }} />
          <h1 className="text-2xl font-black italic tracking-tight">{title}</h1>
          <p className="text-center text-sm text-slate-400">{subtitle}</p>
        </div>
        {children}
        <p className="mt-6 text-center text-sm text-slate-400">
          {footerText}{' '}
          <Link to={footerLinkTo} className="font-medium text-indigo-400 hover:text-indigo-300">
            {footerLinkLabel}
          </Link>
        </p>
      </Card>
    </main>
  )
}
