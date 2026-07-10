import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export interface IEmailService {
  sendEmail(params: SendEmailParams): Promise<boolean>;
  sendBulkEmails(params: SendBulkEmailsParams): Promise<boolean[]>;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface SendBulkEmailsParams {
  recipients: SendEmailParams[];
}

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Mail | null = null;
  private fromAddress: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('email.host', 'localhost');
    const port = this.configService.get<number>('email.port', 1025);
    const user = this.configService.get<string>('email.user', '');
    const pass = this.configService.get<string>('email.pass', '');
    this.fromAddress = this.configService.get<string>('email.from', 'noreply@saferide.com.np');

    const useAuth = user && pass;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: useAuth ? { user, pass } : undefined,
      tls: { rejectUnauthorized: false },
    } as nodemailer.TransportOptions);

    this.transporter
      .verify()
      .then(() => this.logger.log(`SMTP transport ready (${host}:${port})`))
      .catch((err: Error) => {
        this.logger.warn(`SMTP transport verification failed: ${err.message}. Emails will fall back to console.`);
        this.transporter = null;
      });
  }

  async sendEmail(params: SendEmailParams): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log(`[FALLBACK] To: ${params.to} | Subject: ${params.subject} | Body: ${params.body.substring(0, 100)}`);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: params.to,
        subject: params.subject,
        text: params.body,
        html: params.html || undefined,
      });
      this.logger.log(`Email sent to ${params.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${params.to}: ${(error as Error).message}`);
      return false;
    }
  }

  async sendBulkEmails(params: SendBulkEmailsParams): Promise<boolean[]> {
    const results: boolean[] = [];
    for (const email of params.recipients) {
      results.push(await this.sendEmail(email));
    }
    return results;
  }
}
