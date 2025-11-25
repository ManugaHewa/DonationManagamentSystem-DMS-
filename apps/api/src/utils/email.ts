import nodemailer, { Transporter } from 'nodemailer';
import { logger } from './logger';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env from workspace root as well as local .env (with override)
dotenv.config();
const rootEnvPath = path.resolve(process.cwd(), '../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: true });
  logger.info('Loaded root .env for SMTP', { rootEnvPath });
} else {
  logger.warn('Root .env not found for SMTP load', { rootEnvPath });
}

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
  logger.info('SMTP env', { host, port, user, from: process.env.SMTP_FROM });

  if (!host) {
    throw new Error('SMTP_HOST is not configured; cannot send emails');
  }

  const isGmail = host.includes('gmail');
  cachedTransporter = nodemailer.createTransport({
    service: isGmail ? 'gmail' : undefined,
    host,
    port: port || (isGmail ? 587 : 587),
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
  });
  try {
    await cachedTransporter.verify();
    logger.info('SMTP transporter ready', { host, port, user });
  } catch (err) {
    logger.warn('SMTP verify failed', { host, port, user, err });
  }
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
    logger.info(`Email sent to ${options.to}: ${options.subject}${preview ? ` (Preview: ${preview})` : ''}`, {
      messageId: info.messageId,
      response: info.response,
    });
  } catch (error: any) {
    logger.error('Email sending failed:', { error: error?.message, response: error?.response });
    throw error;
  }
}
