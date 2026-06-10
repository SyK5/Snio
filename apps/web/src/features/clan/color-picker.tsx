import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'
import { useDismiss } from '@/hooks/use-dismiss'

const HEX = /^#?[0-9a-fA-F]{6}$/
const QUICK = ['#e11d48', '#f97316', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#94a3b8']

interface Hsv {
  h: number
  s: number
  v: number
}

const clamp = (n: number, min: number, max: number) => (n < min ? min : n > max ? max : n)

function hexToHsv(hex: string): Hsv | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) return null
  const int = parseInt(match[1]!, 16)
  const r = ((int >> 16) & 255) / 255
  const g = ((int >> 8) & 255) / 255
  const b = (int & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = h * 60
    if (h < 0) h += 360
  }
  return { h: Math.round(h), s: max === 0 ? 0 : Math.round((d / max) * 100), v: Math.round(max * 100) }
}

function hsvToHex({ h, s, v }: Hsv): string {
  const S = s / 100
  const V = v / 100
  const c = V * S
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const mm = V - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const to = (n: number) =>
    Math.round((n + mm) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export function ColorPicker({ value, onChange, disabled }: { value: string | null; onChange: (color: string | null) => void; disabled?: boolean }) {
  const current = value ?? ''
  const valid = HEX.test(current)
  const [open, setOpen] = useState(false)
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(current) ?? { h: 230, s: 90, v: 98 })
  const ref = useRef<HTMLDivElement>(null)
  const lastEmit = useRef<string | null>(null)
  const mode = useRef<'sv' | 'hue' | null>(null)
  useDismiss(ref, open, () => setOpen(false))

  useEffect(() => {
    const v = valid ? current.toLowerCase() : null
    if (!v || v === lastEmit.current) return
    const next = hexToHsv(v)
    if (next) setHsv(next)
  }, [current, valid])

  const emit = (next: Hsv) => {
    setHsv(next)
    const hex = hsvToHex(next)
    lastEmit.current = hex
    onChange(hex)
  }

  const moveSv = (e: React.PointerEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const s = clamp((e.clientX - rect.left) / rect.width, 0, 1) * 100
    const v = (1 - clamp((e.clientY - rect.top) / rect.height, 0, 1)) * 100
    emit({ ...hsv, s: Math.round(s), v: Math.round(v) })
  }

  const moveHue = (e: React.PointerEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    emit({ ...hsv, h: Math.round(clamp((e.clientX - rect.left) / rect.width, 0, 1) * 360) })
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{m.clan_role_color()}</span>
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          className="flex w-full items-center gap-2.5 rounded-lg border border-input bg-surface px-3 py-2 text-sm transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="h-5 w-5 shrink-0 rounded-md border border-border" style={{ backgroundColor: valid ? current : 'transparent' }} />
          <span className={cn(valid ? 'text-foreground' : 'text-muted-foreground')}>{valid ? current.toLowerCase() : m.clan_role_color()}</span>
        </button>

        {open && (
          <div className="absolute left-0 z-20 mt-1 w-64 rounded-xl border border-border bg-surface p-3 shadow-lg">
            <div
              className="relative h-32 w-full cursor-crosshair touch-none select-none rounded-lg"
              style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
              onPointerDown={e => {
                mode.current = 'sv'
                e.currentTarget.setPointerCapture(e.pointerId)
                moveSv(e, e.currentTarget)
              }}
              onPointerMove={e => {
                if (mode.current === 'sv') moveSv(e, e.currentTarget)
              }}
              onPointerUp={e => {
                mode.current = null
                e.currentTarget.releasePointerCapture(e.pointerId)
              }}
            >
              <span
                className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/40"
                style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
              />
            </div>

            <div
              className="relative mt-3 h-3 w-full cursor-pointer touch-none select-none rounded-full"
              style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
              onPointerDown={e => {
                mode.current = 'hue'
                e.currentTarget.setPointerCapture(e.pointerId)
                moveHue(e, e.currentTarget)
              }}
              onPointerMove={e => {
                if (mode.current === 'hue') moveHue(e, e.currentTarget)
              }}
              onPointerUp={e => {
                mode.current = null
                e.currentTarget.releasePointerCapture(e.pointerId)
              }}
            >
              <span
                className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/40"
                style={{ left: `${(hsv.h / 360) * 100}%` }}
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-8 w-8 shrink-0 rounded-lg border border-border" style={{ backgroundColor: valid ? current : 'transparent' }} />
              <input
                value={current}
                onChange={e => onChange(e.target.value || null)}
                placeholder="#171afd"
                maxLength={7}
                aria-label={m.clan_role_color_hex()}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              {QUICK.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange(c)}
                  aria-label={c}
                  className={cn(
                    'h-6 w-6 cursor-pointer rounded-md border-2 transition hover:scale-110',
                    current.toLowerCase() === c ? 'border-foreground' : 'border-transparent',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
