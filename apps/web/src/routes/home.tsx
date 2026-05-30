export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0B1120] text-white">
      <img src="/Snio.png" alt="Snio Logo" className="h-24 w-24 object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.35)]" style={{ borderRadius: 24 }} />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-black italic tracking-tight">SNIO</h1>

        <p className="max-w-md text-center text-sm text-slate-400">Esport Plattform für Clans, Events und Trainings</p>
        <p className="max-w-md text-center text-sm loading-text text-slate-400">In Entwicklung</p>
      </div>

      <span className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1 text-xs text-slate-400 backdrop-blur">Schrit 0 läuft</span>
    </main>
  )
}
