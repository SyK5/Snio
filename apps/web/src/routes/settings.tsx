import type { ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun, faDesktop, faLock } from '@fortawesome/free-solid-svg-icons'
import { Card } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { useThemeStore, type ThemePreference } from '@/features/theme/theme.store'
import { useLocaleStore } from '@/features/i18n/locale.store'
import { useCurrentUser } from '@/features/auth/auth.hooks'
import { useAuthStore } from '@/features/auth/auth.store'
import { m } from '@/i18n/paraglide/messages'
import { locales, type Locale } from '@/i18n/paraglide/runtime'
import { AvatarUpload } from '@/features/user/avatar-upload'
import { ProfileFields } from '@/features/user/profile-fields'

const LOCALE_LABELS: Record<string, string> = { de: 'Deutsch', en: 'English', tr: 'Türkçe', ru: 'Русский' }

export function SettingsPage() {
  const preference = useThemeStore(s => s.preference)
  const setPreference = useThemeStore(s => s.setPreference)
  const locale = useLocaleStore(s => s.locale)
  const setLocale = useLocaleStore(s => s.setLocale)
  const accessToken = useAuthStore(s => s.accessToken)
  const { data: user } = useCurrentUser()
  const isAuthed = !!accessToken && !!user

  const themeOptions: { value: ThemePreference; label: string; icon: typeof faMoon }[] = [
    { value: 'system', label: m.settings_theme_system(), icon: faDesktop },
    { value: 'dark', label: m.settings_theme_dark(), icon: faMoon },
    { value: 'light', label: m.settings_theme_light(), icon: faSun },
  ]

  const localeOptions = locales.map(l => ({ value: l, label: LOCALE_LABELS[l] ?? l }))

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{m.settings_title()}</h1>

      <Card padding="md" className="mb-6 flex flex-col gap-6">
        <Field label={m.settings_theme()}>
          <Segmented value={preference} options={themeOptions} onChange={setPreference} />
        </Field>

        <div className="border-t border-border" />

        <Field label={m.settings_language()}>
          <Segmented value={locale} options={localeOptions} onChange={(l: Locale) => setLocale(l)} />
        </Field>
      </Card>

      {isAuthed ? <AccountSection /> : <LockedHint />}
    </div>
  )
}

function AccountSection() {
  return (
    <Card padding="md" className="flex flex-col gap-5">
      <h2 className="text-sm font-semibold text-foreground">{m.settings_account()}</h2>
      <AvatarUpload />
      <div className="border-t border-border" />
      <ProfileFields />
    </Card>
  )
}

function LockedHint() {
  return (
    <Card tone="muted" padding="md" className="flex items-center gap-3">
      <FontAwesomeIcon icon={faLock} className="text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{m.settings_account_locked()}</p>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
