import { m } from '@/i18n/paraglide/messages'

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
      <img src="/Snio.png" alt="Snio Logo" className="h-24 w-24 object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.35)]" style={{ borderRadius: 24 }} />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-black italic tracking-tight">SNIO</h1>

        <p className="max-w-md text-center text-sm text-muted-foreground">{m.home_tagline()}</p>
        <p className="loading-text max-w-md text-center text-sm text-muted-foreground">{m.home_status()}</p>
      </div>

      <span className="rounded-full border border-border bg-surface-muted px-4 py-1 text-xs text-muted-foreground">{m.nav_home()}</span>
    </main>
  )
}
