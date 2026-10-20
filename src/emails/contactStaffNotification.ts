import { renderEmailLayout } from "./layout";
import { escapeHtml } from "../utils/escapeHtml";

/** Internal notification — sent to staff (CONTACT_NOTIFY_EMAIL) whenever a visitor submits the contact form. */
export function contactStaffNotificationEmail(params: {
  name: string;
  email: string;
  organization?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  service?: string | null;
  message: string;
}): { subject: string; html: string } {
  const subject = `New website enquiry: ${params.name}`;

  const optional = (label: string, value?: string | null): [string, string][] =>
    value ? [[label, escapeHtml(value)]] : [];

  const rows: [string, string][] = [
    ["Name", escapeHtml(params.name)],
    ["Email", escapeHtml(params.email)],
    ...optional("Organization", params.organization),
    ...optional("Job title", params.jobTitle),
    ...optional("Phone", params.phone),
    ...optional("Area of interest", params.service),
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #666666; width: 130px; vertical-align: top;">${label}</td>
                <td style="padding: 6px 0; font-size: 14px; color: #0F1B2D; font-weight: 600;">${value}</td>
              </tr>`
    )
    .join("");

  const html = renderEmailLayout({
    preheader: `${escapeHtml(params.name)} sent a message through the SAMATECHS website.`,
    heading: "New website enquiry",
    bodyHtml: `
      <p style="margin: 0 0 20px;">A visitor sent a message through the contact form. Reply to this email to answer them directly.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background-color: #F4F8FD; border: 1px solid #E4ECF7; border-radius: 12px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 20px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${rowsHtml}
            </table>
          </td>
        </tr>
      </table>
      <p style="margin: 0 0 8px; font-size: 14px; color: #666666;">Message</p>
      <p style="margin: 0; color: #0F1B2D; white-space: pre-wrap;">${escapeHtml(params.message)}</p>
    `,
  });

  return { subject, html };
}
