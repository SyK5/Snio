import { Link } from 'react-router-dom'

export function VerifyEmailSentPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0B1120] px-4 text-white">
      <h1 className="text-2xl font-bold">Fast geschafft</h1>
      <p className="max-w-md text-center text-sm text-slate-400">
        Wir haben dir eine E-Mail zur Bestätigung geschickt. Öffne den Link darin, um dein Konto zu aktivieren.
      </p>
      <Link to="/login" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
        Zur Anmeldung
      </Link>
    </main>
  )
}
