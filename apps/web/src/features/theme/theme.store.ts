import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'system' | 'dark' | 'light'
type ResolvedTheme = 'dark' | 'light'

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

let transitionTimer: ReturnType<typeof setTimeout> | undefined

export function applyTheme(preference: ThemePreference, animate = false): void {
  const root = document.documentElement
  if (animate) {
    root.classList.add('theme-transition')
    clearTimeout(transitionTimer)
    transitionTimer = setTimeout(() => root.classList.remove('theme-transition'), 300)
  }
  root.setAttribute('data-theme', resolve(preference))
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      preference: 'system',
      setPreference: preference => {
        applyTheme(preference, true)
        set({ preference })
      },
    }),
    {
      name: 'snio-theme',
      onRehydrateStorage: () => state => {
        if (state) applyTheme(state.preference)
      },
    },
  ),
)
