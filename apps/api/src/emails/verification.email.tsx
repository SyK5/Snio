import { Heading, Section, Text } from '@react-email/components'
import { EmailLayout, emailColors, emailFontBody } from './components/layout'
import { EmailButton } from './components/button'

interface VerificationEmailProps {
  link: string
  logoUrl: string
}

export function VerificationEmail({ link, logoUrl }: VerificationEmailProps) {
  return (
    <EmailLayout preview="Bestätige deine E-Mail für Snio" logoUrl={logoUrl}>
      <Heading style={{ color: emailColors.text, fontSize: 22, fontWeight: 400, letterSpacing: '0.5px', margin: '0 0 12px', fontFamily: emailFontBody }}>
        WILLKOMMEN BEI SNIO
      </Heading>
      <Text style={{ color: emailColors.muted, fontSize: 14, lineHeight: '22px', margin: '0 0 24px' }}>
        Bestätige deine E-Mail Adresse, um dein Konto zu aktivieren und loszulegen.
      </Text>
      <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
        <EmailButton href={link} label="E-Mail bestätigen" />
      </Section>
      <Text style={{ color: emailColors.muted, fontSize: 12, lineHeight: '20px', margin: 0 }}>
        Der Link ist 24 Stunden gültig. Falls du dich nicht registriert hast, ignoriere diese E-Mail.
      </Text>
    </EmailLayout>
  )
}

VerificationEmail.PreviewProps = {
  link: 'https://snio.gg/verify-email?token=preview-token',
  logoUrl: 'https://snio.gg/Snio.png',
} satisfies VerificationEmailProps

export default VerificationEmail
