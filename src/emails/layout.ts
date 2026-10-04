/**
 * Shared HTML shell for all outbound emails — inline styles and table-based
 * layout throughout, since that's what actually renders consistently across
 * email clients (Gmail, Outlook, Apple Mail), unlike a linked stylesheet or
 * modern CSS. Mirrors the Aramway site's palette (app/globals.css: primary
 * #cc9138, ink #0c0903, cream #fbf7f4/#f5ebd6). The header logo is loaded
 * from the live site (FRONTEND_URL), with alt text as the fallback for
 * clients that block remote images by default.
 */

const FRONTEND_URL = process.env.FRONTEND_URL || "https://aramway.com";

const COLORS = {
  primary: "#cc9138",
  primaryDark: "#a8752a",
  ink: "#0c0903",
  muted: "#666666",
  cream: "#fbf7f4",
  creamDeep: "#f5ebd6",
  border: "#eae7e4",
  white: "#ffffff",
};

export interface EmailLayoutOptions {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export function renderEmailLayout({ preheader, heading, bodyHtml, ctaLabel, ctaUrl }: EmailLayoutOptions): string {
  const cta =
    ctaLabel && ctaUrl
      ? `
      <tr>
        <td align="center" style="padding: 8px 0 4px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" bgcolor="${COLORS.primary}" style="border-radius: 8px;">
                <a href="${ctaUrl}" target="_blank"
                   style="display: inline-block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: ${COLORS.white}; text-decoration: none; border-radius: 8px;">
                  ${ctaLabel}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.cream}; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLORS.cream};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: ${COLORS.white}; border-radius: 16px; overflow: hidden; border: 1px solid ${COLORS.border};">
          <tr>
            <td align="center" bgcolor="${COLORS.white}" style="background-color: ${COLORS.white}; padding: 32px 24px; border-bottom: 1px solid ${COLORS.border};">
              <img src="${FRONTEND_URL}/images/logo-footer.png" width="160" alt="ARAMWAY GROUP" style="display: block; width: 160px; max-width: 100%; height: auto; border: 0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 36px 8px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; line-height: 1.35; color: ${COLORS.ink}; font-weight: 800;">${heading}</h1>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 15px; line-height: 1.7; color: ${COLORS.muted};">
                    ${bodyHtml}
                  </td>
                </tr>
                ${cta}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 36px 36px;">
              <hr style="border: none; border-top: 1px solid ${COLORS.border}; margin: 0 0 20px;" />
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${COLORS.muted};">
                ARAMWAY GROUP &middot; Bridging U.S. &amp; MENA Markets<br />
                <a href="${FRONTEND_URL}" style="color: ${COLORS.primary}; text-decoration: none;">${FRONTEND_URL.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
