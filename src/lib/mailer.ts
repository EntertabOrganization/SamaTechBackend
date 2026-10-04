import nodemailer, { Transporter } from "nodemailer";

/**
 * Generic SMTP mailer — works with any provider (Gmail, SES, SendGrid,
 * Mailgun, ...) since credentials are supplied via env, not a vendor SDK.
 * Emails are always best-effort: nothing in the request/response cycle that
 * triggers a send (subscribing, publishing a blog, booking a consultation)
 * should ever fail because the mail server is unreachable or misconfigured.
 */

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  // Real credentials can end up in process.env during tests as a side effect
  // of unrelated imports (e.g. @prisma/client auto-loading .env at require
  // time) — automated tests must never be able to send a real email no
  // matter how that happens, so this check comes first and is absolute.
  if (process.env.NODE_ENV === "test") {
    transporter = null;
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[mailer] SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS not fully configured — emails will be logged, not sent."
    );
    transporter = null;
    return transporter;
  }

  const port = Number(SMTP_PORT);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export interface SendMailInput {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailInput): Promise<void> {
  const from = process.env.EMAIL_FROM || "ARAMWAY GROUP <no-reply@aramway.com>";
  const client = getTransporter();

  if (!client) {
    console.log(`[mailer] (not sent — SMTP not configured) to=${to} subject="${subject}"`);
    return;
  }

  try {
    const info = await client.sendMail({ from, to, subject, html });
    console.log(`[mailer] sent "${subject}" to ${to} (messageId=${info.messageId})`);
  } catch (err) {
    console.error(`[mailer] failed to send "${subject}" to ${to}:`, err);
  }
}
