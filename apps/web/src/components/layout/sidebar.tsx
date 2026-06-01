import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { ProfileMenu } from './profile-menu'
import { cn } from '@/lib/utils'

const NAV: { to: string; icon: IconDefinition; label: string }[] = [{ to: '/', icon: faHouse, label: 'Start' }]

export function Sidebar() {
  return (
    <aside className="flex w-16 flex-col items-center gap-6 border-r border-slate-800 bg-slate-950/60 py-5">
      <img src="/Snio.png" alt="Snio" className="h-9 w-9 object-contain" style={{ borderRadius: 12 }} />
      <nav className="flex flex-1 flex-col items-center gap-2">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            title={item.label}
            className={({ isActive }) =>
              cn(
                'flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white',
                isActive && 'bg-indigo-600/20 text-indigo-400',
              )
            }
          >
            <FontAwesomeIcon icon={item.icon} />
          </NavLink>
        ))}
      </nav>
      <ProfileMenu />
    </aside>
  )
}
