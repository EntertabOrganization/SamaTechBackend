import { renderEmailLayout } from "./layout";
import { escapeHtml } from "../utils/escapeHtml";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Internal notification — sent to staff (CONSULTATION_NOTIFY_EMAIL) whenever a visitor books a consultation. */
export function consultationStaffNotificationEmail(params: {
  name: string;
  company?: string | null;
  email: string;
  phone: string;
  service?: string | null;
  notes?: string | null;
  date: Date;
  time: string;
  meetLink: string;
}): { subject: string; html: string } {
  const subject = `New consultation booking: ${params.name}`;
  const formattedDate = formatDate(params.date);

  const rows: [string, string][] = [
    ["Name", escapeHtml(params.name)],
    ...(params.company ? ([["Company", escapeHtml(params.company)]] as [string, string][]) : []),
    ["Email", escapeHtml(params.email)],
    ["Phone", escapeHtml(params.phone)],
    ...(params.service ? ([["Service", escapeHtml(params.service)]] as [string, string][]) : []),
    ["Date", formattedDate],
    ["Time", params.time],
    [
      "Meeting Link",
      `<a href="${params.meetLink}" style="color: #cc9138; font-weight: 600; text-decoration: none;">${params.meetLink}</a>`,
    ],
    ...(params.notes ? ([["Notes", escapeHtml(params.notes)]] as [string, string][]) : []),
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #666666; width: 110px; vertical-align: top;">${label}</td>
                <td style="padding: 6px 0; font-size: 14px; color: #0c0903; font-weight: 600;">${value}</td>
              </tr>`
    )
    .join("");

  const html = renderEmailLayout({
    preheader: `${params.name} just booked a consultation for ${formattedDate} at ${params.time}.`,
    heading: "New consultation booking 📅",
    bodyHtml: `
      <p style="margin: 0 0 20px;">A new consultation was just booked on ARAMWAY GROUP. Details below:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background-color: #f9f3e7; border: 1px solid #f5ebd6; border-radius: 12px;">
        <tr>
          <td style="padding: 20px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${rowsHtml}
            </table>
          </td>
        </tr>
      </table>
    `,
  });

  return { subject, html };
}
