import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { render } from '@react-email/render'
import { Resend } from 'resend'
import { mailConfig } from './mail.config'
import { VerificationEmail } from '../../emails/verification.email'
import { PasswordResetEmail } from '../../emails/password-reset.email'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly client: Resend | null

  constructor(@Inject(mailConfig.KEY) private readonly config: ConfigType<typeof mailConfig>) {
    this.client = config.apiKey ? new Resend(config.apiKey) : null
  }

  async sendVerification(to: string, token: string): Promise<void> {
    const link = `${this.config.webBaseUrl}/verify-email?token=${token}`
    const html = await render(VerificationEmail({ link, logoUrl: this.config.logoUrl }))
    await this.send(to, 'Bestätige deine E-Mail', html)
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const link = `${this.config.webBaseUrl}/reset-password?token=${token}`
    const html = await render(PasswordResetEmail({ link, logoUrl: this.config.logoUrl }))
    await this.send(to, 'Passwort zurücksetzen', html)
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.client) {
      this.logger.warn(`Resend nicht konfiguriert, Mail an ${to} nicht gesendet. Betreff: ${subject}`)
      this.logger.debug(html)
      return
    }
    const { error } = await this.client.emails.send({ from: this.config.from, to, subject, html })
    if (error) {
      this.logger.error(`Mailversand an ${to} fehlgeschlagen: ${error.message}`)
      throw new Error('Mailversand fehlgeschlagen')
    }
  }
}
