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

export function consultationConfirmationEmail(params: {
  name: string;
  date: Date;
  time: string;
  meetLink: string;
  service?: string | null;
}): { subject: string; html: string } {
  const subject = "Your ARAMWAY GROUP consultation is confirmed";
  const name = escapeHtml(params.name);
  const formattedDate = formatDate(params.date);
  const service = params.service ? escapeHtml(params.service) : null;

  const html = renderEmailLayout({
    preheader: `Your consultation is booked for ${formattedDate} at ${params.time}.`,
    heading: "Your consultation is booked ✅",
    bodyHtml: `
      <p style="margin: 0 0 16px;">Hi ${name},</p>
      <p style="margin: 0 0 20px;">
        Thank you for booking a consultation with ARAMWAY GROUP. Here are your details:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background-color: #f9f3e7; border: 1px solid #f5ebd6; border-radius: 12px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 20px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #666666; width: 110px;">Date</td>
                <td style="padding: 6px 0; font-size: 14px; color: #0c0903; font-weight: 600;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #666666;">Time</td>
                <td style="padding: 6px 0; font-size: 14px; color: #0c0903; font-weight: 600;">${params.time}</td>
              </tr>
              ${
                service
                  ? `<tr>
                <td style="padding: 6px 0; font-size: 14px; color: #666666;">Service</td>
                <td style="padding: 6px 0; font-size: 14px; color: #0c0903; font-weight: 600;">${service}</td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #666666;">Meeting Link</td>
                <td style="padding: 6px 0; font-size: 14px;">
                  <a href="${params.meetLink}" style="color: #cc9138; font-weight: 600; text-decoration: none;">${params.meetLink}</a>
                </td>
              </tr>
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
