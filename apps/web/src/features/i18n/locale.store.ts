import { create } from 'zustand'
import { getLocale, setLocale as paraglideSetLocale, type Locale } from '@/i18n/paraglide/runtime'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleState>(set => ({
  locale: getLocale(),
  setLocale: locale => {
    paraglideSetLocale(locale, { reload: false })
    document.documentElement.setAttribute('lang', locale)
    set({ locale })
  },
}))
