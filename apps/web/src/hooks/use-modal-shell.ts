import { useEffect, useRef, type RefObject } from 'react'
import { useDismiss } from './use-dismiss'

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

let lockCount = 0

export function useModalShell(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void, paused = false): void {
  useDismiss(ref, open && !paused, onClose)
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    if (lockCount++ === 0) document.body.style.overflow = 'hidden'
    return () => {
      if (--lockCount === 0) document.body.style.overflow = ''
      restoreRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open || paused) return
    const panel = ref.current
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    ;(focusables()[0] ?? panel)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]!
      const last = items[items.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [ref, open, paused])
}
