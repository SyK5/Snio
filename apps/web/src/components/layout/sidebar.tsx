import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faShieldHalved, faCalendarDays, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { ProfileMenu } from './profile-menu'
import { NotificationBell } from '@/features/notification/notification-bell'
import { useAuthStore } from '@/features/auth/auth.store'
import { useProfile } from '@/features/user/user.hooks'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'
import { ADMIN_CATEGORIES } from '@/features/admin/admin-categories'

interface NavItem {
  to: string
  icon: IconDefinition
  label: string
  end?: boolean
}

const RAIL_BASE = 'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition'

const railLink1 = ({ isActive }: { isActive: boolean }) =>
  cn(RAIL_BASE, 'text-nav-1-fg hover:bg-nav-1-muted hover:text-nav-1-fg-strong', isActive && 'bg-nav-1-active text-nav-1-fg-strong')

const railLink2 = ({ isActive }: { isActive: boolean }) =>
  cn(RAIL_BASE, 'text-nav-2-fg hover:bg-nav-2-muted hover:text-nav-2-fg-strong', isActive && 'bg-nav-2-active text-nav-2-fg-strong')

export function Sidebar() {
  const isAuthed = useAuthStore(s => !!s.accessToken)
  const { data: profile } = useProfile()
  const isAdmin = !!profile?.isPlatformAdmin

  const topNav: NavItem[] = [
    { to: '/', icon: faHouse, label: m.nav_home(), end: true },
    ...(isAuthed ? [{ to: '/clans', icon: faShieldHalved, label: m.nav_clans() }] : []),
    ...(isAuthed ? [{ to: '/events', icon: faCalendarDays, label: m.nav_events() }] : []),
  ]

  return (
    <>
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col items-center gap-4 border-r border-border bg-nav-1 py-5 z-40">
        <img src="/Snio.png" alt="Snio" className="h-9 w-9 shrink-0 object-contain" style={{ borderRadius: 12 }} />
        <NavScroll indicatorClassName="text-nav-1-fg">
          {topNav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} title={item.label} className={railLink1}>
              <FontAwesomeIcon icon={item.icon} />
            </NavLink>
          ))}
        </NavScroll>
        {isAuthed && <NotificationBell />}
        <ProfileMenu />
      </aside>

      {isAdmin && (
        <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col items-center py-5 border-r border-border bg-nav-2">
          <NavScroll indicatorClassName="text-nav-2-fg">
            {ADMIN_CATEGORIES.map(cat => (
              <NavLink key={cat.key} to={cat.path} title={cat.label()} className={railLink2}>
                <FontAwesomeIcon icon={cat.icon} />
              </NavLink>
            ))}
          </NavScroll>
        </aside>
      )}
    </>
  )
}

function NavScroll({ children, indicatorClassName }: { children: ReactNode; indicatorClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)

  const update = () => {
    const el = ref.current
    if (!el) return
    setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 4)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  useEffect(update)

  return (
    <div className="relative flex w-full min-h-0 flex-1 flex-col">
      <div ref={ref} className="scrollbar-hide flex flex-1 flex-col items-center gap-2 overflow-y-auto">
        {children}
      </div>
      {more && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pt-4">
          <FontAwesomeIcon icon={faChevronDown} className={cn('animate-bounce text-[10px]', indicatorClassName ?? 'text-muted-foreground')} />
        </div>
      )}
    </div>
  )
}
