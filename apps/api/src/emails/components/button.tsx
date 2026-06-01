import { Button } from '@react-email/components'
import { emailColors } from './layout'

export function EmailButton({ href, label }: { href: string; label: string }) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: emailColors.primary,
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 600,
        textDecoration: 'none',
        padding: '12px 28px',
        borderRadius: 10,
        display: 'inline-block',
      }}
    >
      {label}
    </Button>
  )
}
