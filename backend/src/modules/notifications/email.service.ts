import { Injectable, Logger } from '@nestjs/common';

export interface IEmailService {
  sendEmail(params: SendEmailParams): Promise<void>;
  sendBulkEmails(params: SendBulkEmailsParams): Promise<void>;
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

  async sendEmail(params: SendEmailParams): Promise<void> {
    this.logger.log('=== Email Notification (Dummy Implementation) ===');
    this.logger.log(`To: ${params.to}`);
    this.logger.log(`Subject: ${params.subject}`);
    this.logger.log(`Body: ${params.body}`);
    if (params.html) {
      this.logger.log(`HTML: ${params.html.substring(0, 200)}...`);
    }
    this.logger.log('===============================================');
  }

  async sendBulkEmails(params: SendBulkEmailsParams): Promise<void> {
    for (const email of params.recipients) {
      await this.sendEmail(email);
    }
  }
}
