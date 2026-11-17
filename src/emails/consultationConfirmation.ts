import { renderEmailLayout } from "./layout";
import { escapeHtml } from "../utils/escapeHtml";
import { timeZoneLabel } from "../utils/consultationTime";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function consultationConfirmationEmail(params: {
  name: string;
  company?: string | null;
  email?: string | null;
  date: Date;
  time: string;
  meetLink: string;
  service?: string | null;
}): { subject: string; html: string } {
  const subject = "Your consultation with SAMATECHS is booked";
  const name = escapeHtml(params.name);
  const company = params.company ? escapeHtml(params.company) : null;
  const email = params.email ? escapeHtml(params.email) : null;
  const formattedDate = formatDate(params.date);
  const formattedTime = `${escapeHtml(params.time)} (${timeZoneLabel(params.date)})`;
  const service = params.service ? escapeHtml(params.service) : null;

  const rows: [string, string][] = [
    ["Name", name],
    ...(company ? ([["Company", company]] as [string, string][]) : []),
    ...(email ? ([["Email", email]] as [string, string][]) : []),
    ["Date", formattedDate],
    ["Time", formattedTime],
    ...(service ? ([["Service", service]] as [string, string][]) : []),
    [
      "Meeting Link",
      `<a href="${escapeHtml(params.meetLink)}" target="_blank" style="color: #0078FF; font-weight: 600; text-decoration: none;">${escapeHtml(params.meetLink)}</a>`,
    ],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
              <tr>
                <td style="padding: 6px 16px 6px 0; font-size: 14px; color: #425367; width: 110px; min-width: 110px; white-space: nowrap; vertical-align: top;">${label}</td>
                <td style="padding: 6px 0; font-size: 14px; overflow-wrap: anywhere; word-break: break-word; color: #121A23; font-weight: 600;">${value}</td>
              </tr>`
    )
    .join("");

  const html = renderEmailLayout({
    preheader: `Your consultation is booked for ${formattedDate} at ${formattedTime}.`,
    heading: "Your consultation is booked ✅",
    bodyHtml: `
      <p style="margin: 0 0 16px;">Hi ${name},</p>
      <p style="margin: 0 0 20px;">
        Thank you for booking a consultation with SAMATECHS. Here are your details:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background-color: #F4F8FD; background-image: linear-gradient(180deg, #FFFFFF 0%, #E9F0F9 100%); border: 1px solid #BDD4EE; border-radius: 12px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 20px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${rowsHtml}
            </table>
          </td>
        </tr>
      </table>
      <p style="margin: 0;">
        Our team will be in touch if anything changes. We look forward to speaking with you.
      </p>
    `,
    ctaLabel: "Join the Meeting",
    ctaUrl: params.meetLink,
  });

  return { subject, html };
}
