import nodemailer from 'nodemailer';

import type { AppConfig } from '../../config/env.js';

export type MailTemplateName = 'email-verification' | 'password-reset';

export interface MailMessage {
  readonly to: string;
  readonly template: MailTemplateName;
  readonly variables: Record<string, string>;
}

export class MailService {
  private readonly transport: nodemailer.Transporter;

  public constructor(private readonly config: AppConfig) {
    this.transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
    });
  }

  public async send(message: MailMessage): Promise<void> {
    const content = this.render(message.template, message.variables);
    await this.transport.sendMail({
      from: this.config.SMTP_FROM,
      to: message.to,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
  }

  private render(template: MailTemplateName, variables: Record<string, string>) {
    const actionUrl = variables.actionUrl ?? this.config.WEB_APP_URL;
    const app = escapeHtml(this.config.APP_NAME);
    const templates: Record<MailTemplateName, { subject: string; heading: string; body: string }> =
      {
        'email-verification': {
          subject: `${this.config.APP_NAME}: verify your e-mail`,
          heading: 'Verify your e-mail',
          body: 'Use the secure link below to verify your e-mail address.',
        },
        'password-reset': {
          subject: `${this.config.APP_NAME}: reset your password`,
          heading: 'Reset your password',
          body: 'Use the secure link below to choose a new password.',
        },
      };
    const selected = templates[template];
    const url = escapeHtml(actionUrl);
    return {
      subject: selected.subject,
      text: `${selected.heading}\n\n${selected.body}\n\n${actionUrl}`,
      html: `<main><h1>${escapeHtml(selected.heading)}</h1><p>${escapeHtml(selected.body)}</p><p><a href="${url}">Continue to ${app}</a></p></main>`,
    };
  }
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ??
      character,
  );
}
