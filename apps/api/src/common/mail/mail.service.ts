import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { Resend } from 'resend'
import { mailConfig } from './mail.config'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly client: Resend | null

  constructor(@Inject(mailConfig.KEY) private readonly config: ConfigType<typeof mailConfig>) {
    this.client = config.apiKey ? new Resend(config.apiKey) : null
  }

  async sendVerification(to: string, token: string): Promise<void> {
    const link = `${this.config.webBaseUrl}/verify-email?token=${token}`
    await this.send(to, 'Bestätige deine E-Mail', this.linkTemplate('E-Mail bestätigen', link))
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const link = `${this.config.webBaseUrl}/reset-password?token=${token}`
    await this.send(to, 'Passwort zurücksetzen', this.linkTemplate('Neues Passwort setzen', link))
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

  private linkTemplate(action: string, link: string): string {
    return `<div style="font-family:sans-serif"><p>Klicke zum Fortfahren:</p><p><a href="${link}">${action}</a></p><p>Link gültig für begrenzte Zeit. Falls du das nicht warst, ignoriere diese Mail.</p></div>`
  }
}
