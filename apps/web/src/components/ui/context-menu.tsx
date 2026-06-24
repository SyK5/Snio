import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type MouseEventHandler } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

import { Card } from '@/components/ui/card'
import { useDismiss } from '@/hooks/use-dismiss'
import { cn } from '@/lib/utils'

export interface ContextMenuItem {
  icon?: IconDefinition
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}

export type ContextMenuEntry = ContextMenuItem | 'separator'

interface MenuState {
  x: number
  y: number
  items: ContextMenuEntry[]
}

type Listener = (menu: MenuState | null) => void

let menu: MenuState | null = null

const listeners = new Set<Listener>()

export function openContextMenu(event: MouseEvent, items: ContextMenuEntry[]) {
  event.preventDefault()

  menu = {
    x: event.clientX,
    y: event.clientY,
    items,
  }

  listeners.forEach(listener => listener(menu))
}

export function withContextMenu<E extends Element = Element>(items?: ContextMenuEntry[], onContextMenu?: MouseEventHandler<E>) {
  return (event: MouseEvent<E>) => {
    onContextMenu?.(event)
    if (!event.defaultPrevented && items?.length) openContextMenu(event, items)
  }
}

function closeContextMenu() {
  menu = null

  listeners.forEach(listener => listener(menu))
}

function subscribe(listener: Listener) {
  listeners.add(listener)

  listener(menu)

  return () => {
    listeners.delete(listener)
  }
}

export function ContextMenuRoot() {
  const [menuState, setMenuState] = useState<MenuState | null>(null)

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => subscribe(setMenuState), [])

  useDismiss(ref, menuState !== null, closeContextMenu)

  useLayoutEffect(() => {
    if (!menuState || !ref.current) {
      return
    }

    const { width, height } = ref.current.getBoundingClientRect()

    const x = Math.min(menuState.x, window.innerWidth - width - 8)

    const y = Math.min(menuState.y, window.innerHeight - height - 8)

    if (x !== menuState.x || y !== menuState.y) {
      setMenuState({
        ...menuState,
        x: Math.max(8, x),
        y: Math.max(8, y),
      })
    }
  }, [menuState])

  if (!menuState) {
    return null
  }

  return createPortal(
    <Card
      ref={ref}
      tone="base"
      padding="none"
      role="menu"
      className="fixed z-50 min-w-44 p-1 shadow-2xl"
      style={{
        top: menuState.y,
        left: menuState.x,
      }}
    >
      {menuState.items.map((item, i) =>
        item === 'separator' ? (
          <div key={i} className="my-1 border-t border-border" />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onClick()
              closeContextMenu()
            }}
            className={cn(
              'flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition',
              'text-muted-foreground hover:bg-muted hover:text-foreground',
              'disabled:pointer-events-none disabled:opacity-50',
              item.destructive && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
            )}
          >
            {item.icon && <FontAwesomeIcon icon={item.icon} className="w-4" />}

            {item.label}
          </button>
        ),
      )}
    </Card>,
    document.body,
  )
}
