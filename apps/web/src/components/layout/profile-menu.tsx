import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser, faGear, faRightFromBracket, faRightToBracket, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Card } from '@/components/ui/card'
import { useCurrentUser, useLogout } from '@/features/auth/auth.hooks'
import { useAuthStore } from '@/features/auth/auth.store'
import { useClickOutside } from '@/hooks/use-click-outside'

export function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const accessToken = useAuthStore(s => s.accessToken)
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const close = () => setOpen(false)
  const isAuthed = !!accessToken && !!user

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Profil"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full ring-2 ring-transparent transition hover:ring-indigo-500"
      >
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <FontAwesomeIcon icon={faCircleUser} className="text-3xl text-slate-400" />
        )}
      </button>

      {open && (
        <Card tone="base" padding="none" className="absolute bottom-0 left-14 z-50 w-56 p-2 shadow-2xl">
          {isAuthed && (
            <div className="mb-1 border-b border-slate-800 pb-2">
              <div className="px-2 pt-1 text-sm font-semibold text-white">{user.display_name}</div>
              <div className="truncate px-2 text-xs text-slate-400">{user.email}</div>
            </div>
          )}
          {isAuthed ? (
            <>
              <MenuLink to="/settings" icon={faGear} label="Einstellungen" onClick={close} />
              <MenuButton
                icon={faRightFromBracket}
                label="Abmelden"
                onClick={() => {
                  logout.mutate()
                  close()
                }}
              />
            </>
          ) : (
            <>
              <MenuLink to="/login" icon={faRightToBracket} label="Anmelden" onClick={close} />
              <MenuLink to="/register" icon={faUserPlus} label="Registrieren" onClick={close} />
            </>
          )}
        </Card>
      )}
    </div>
  )
}

function MenuLink({ to, icon, label, onClick }: { to: string; icon: IconDefinition; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
    >
      <FontAwesomeIcon icon={icon} className="w-4 text-slate-400" />
      {label}
    </Link>
  )
}

function MenuButton({ icon, label, onClick }: { icon: IconDefinition; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
    >
      <FontAwesomeIcon icon={icon} className="w-4 text-slate-400" />
      {label}
    </button>
  )
}
