import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faUsers } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { ProfileMenu } from './profile-menu'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'

interface NavItem {
  to: string
  icon: IconDefinition
  label: string
  end?: boolean
}

export function Sidebar() {
  const topNav: NavItem[] = [
    { to: '/', icon: faHouse, label: m.nav_home(), end: true },
    { to: '/clans', icon: faUsers, label: m.nav_clans() },
  ]

  return (
    <aside className="flex w-16 flex-col items-center gap-6 border-r border-border bg-surface-muted py-5">
      <img src="/Snio.png" alt="Snio" className="h-9 w-9 object-contain" style={{ borderRadius: 12 }} />

      <nav className="flex flex-1 flex-col items-center gap-2">
        {topNav.map(item => (
          <NavItemLink key={item.to} item={item} />
        ))}
      </nav>

      <ProfileMenu />
    </aside>
  )
}

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={item.label}
      className={({ isActive }) =>
        cn(
          'flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground',
          isActive && 'bg-primary/20 text-primary',
        )
      }
    >
      <FontAwesomeIcon icon={item.icon} />
    </NavLink>
  )
}
