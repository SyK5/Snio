import { Body, Container, Head, Html, Img, Preview, Section, Text } from '@react-email/components'
import type { ReactNode } from 'react'

interface EmailLayoutProps {
  preview: string
  logoUrl: string
  children: ReactNode
}

const COLORS = {
  bg: '#0b1120',
  surface: '#131c31',
  border: '#1e2a44',
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#4f46e5',
}

const FONT_BODY = "'Trebuchet MS', system-ui, 'Segoe UI', Roboto, Arial, sans-serif"
const FONT_DISPLAY = "Impact, Haettenschweiler, 'Arial Narrow Bold', 'Arial Black', sans-serif"

export function EmailLayout({ preview, logoUrl, children }: EmailLayoutProps) {
  return (
    <Html lang="de">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: COLORS.bg, margin: 0, padding: '40px 0', fontFamily: FONT_BODY }}>
        <Container
          style={{ maxWidth: 480, margin: '0 auto', backgroundColor: COLORS.surface, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}
        >
          <Section style={{ padding: '32px 32px 0', textAlign: 'center' }}>
            <Img src={logoUrl} width="56" height="56" alt="Snio" style={{ borderRadius: 14, margin: '0 auto' }} />
            <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: 400, letterSpacing: '2px', margin: '14px 0 0', fontFamily: FONT_DISPLAY }}>SNIO</Text>
          </Section>
          <Section style={{ padding: '24px 32px 32px' }}>{children}</Section>
        </Container>
        <Text style={{ color: COLORS.muted, fontSize: 12, textAlign: 'center', margin: '20px 0 0', fontFamily: FONT_BODY }}>Snio Esport Plattform · snio.gg</Text>
      </Body>
    </Html>
  )
}

export const emailColors = COLORS
export const emailFontBody = FONT_BODY
export const emailFontDisplay = FONT_DISPLAY
