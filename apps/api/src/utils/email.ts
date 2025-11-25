import nodemailer, { Transporter } from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

let cachedTransporter: Transporter | null = null;
let usingTestAccount = false;

async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '0', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If host is provided, honor it even without auth (e.g., MailDev/Mailhog/relay)
  if (host) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });
    return cachedTransporter;
  }

  // Fallback: create a test account so emails always "send" in dev with a preview URL
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  usingTestAccount = true;
  logger.warn('SMTP_HOST not configured. Using Ethereal test account; emails will appear in preview URL only.');
  return cachedTransporter;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@temple.org',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    const preview = usingTestAccount ? nodemailer.getTestMessageUrl(info) : null;
    logger.info(`Email sent to ${options.to}: ${options.subject}${preview ? ` (Preview: ${preview})` : ''}`);
  } catch (error) {
    // If primary transport fails, try falling back to a test transport so we at least get a preview URL
    if (!usingTestAccount) {
      logger.warn('Primary SMTP send failed, attempting Ethereal fallback...', error);
      cachedTransporter = null;
      usingTestAccount = false;
      const transporter = await getTransporter();
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@temple.org',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      const preview = nodemailer.getTestMessageUrl(info);
      logger.info(`Email sent via fallback to ${options.to}: ${options.subject} (Preview: ${preview})`);
      return;
    }

    logger.error('Email sending failed:', error);
    throw error;
  }
}
