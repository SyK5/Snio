import { Heading, Section, Text } from '@react-email/components'
import { EmailLayout, emailColors, emailFontBody } from './components/layout'
import { EmailButton } from './components/button'

interface PasswordResetEmailProps {
  link: string
  logoUrl: string
}

export function PasswordResetEmail({ link, logoUrl }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Passwort zurücksetzen für Snio" logoUrl={logoUrl}>
      <Heading style={{ color: emailColors.text, fontSize: 22, fontWeight: 400, letterSpacing: '0.5px', margin: '0 0 12px', fontFamily: emailFontBody }}>
        PASSWORT ZURÜCKSETZEN
      </Heading>
      <Text style={{ color: emailColors.muted, fontSize: 14, lineHeight: '22px', margin: '0 0 24px' }}>
        Klicke auf den Button, um ein neues Passwort für dein Snio Konto zu setzen.
      </Text>
      <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
        <EmailButton href={link} label="Neues Passwort setzen" />
      </Section>
      <Text style={{ color: emailColors.muted, fontSize: 12, lineHeight: '20px', margin: 0 }}>
        Der Link ist 1 Stunde gültig. Falls du das nicht angefordert hast, bleibt dein Passwort unverändert.
      </Text>
    </EmailLayout>
  )
}

PasswordResetEmail.PreviewProps = {
  link: 'https://snio.gg/reset-password?token=preview-token',
  logoUrl: 'https://snio.gg/Snio.png',
} satisfies PasswordResetEmailProps

export default PasswordResetEmail
