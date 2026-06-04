import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '../config/env';

let transporter: Transporter | null = null;

/** Lazily builds the SMTP transporter, or returns null when SMTP is unset. */
function getTransporter(): Transporter | null {
  if (!env.email.host) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: env.email.user ? { user: env.email.user, pass: env.email.password } : undefined,
    });
  }
  return transporter;
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const activeTransporter = getTransporter();

  // Development fallback: log the email (including any token link) instead of
  // sending it, so flows are testable without configuring SMTP.
  if (!activeTransporter) {
    console.log(`\n📧 [email] To: ${to}\n   Subject: ${subject}\n   ${html}\n`);
    return;
  }

  await activeTransporter.sendMail({ from: env.email.from, to, subject, html });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${env.apiUrl}/auth/verify-email?token=${token}`;
  await sendMail(
    to,
    'Verify your ExpenSee email',
    `Welcome to ExpenSee! Confirm your email address by opening this link: ${link}`,
  );
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  await sendMail(
    to,
    'Reset your ExpenSee password',
    `Use this code in the ExpenSee app to reset your password: ${token}\n` +
      `This code expires in 1 hour. If you didn't request it, you can ignore this email.`,
  );
}
