/**
 * Shared HTML shell for all outbound emails — inline styles and table-based
 * layout throughout, since that's what actually renders consistently across
 * email clients (Gmail, Outlook, Apple Mail), unlike a linked stylesheet or
 * modern CSS. Uses the SamaTechs blue and neutral palette. The header logo is loaded
 * from the live site (FRONTEND_URL), with alt text as the fallback for
 * clients that block remote images by default.
 */

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://www.samatechs.com").replace(/\/+$/, "");
const LOGO_URL = process.env.EMAIL_LOGO_URL || `${FRONTEND_URL}/horizontal-logo%201.svg`;

const COLORS = {
  primary: "#0078FF",
  primaryDark: "#005BC2",
  ink: "#121A23",
  muted: "#425367",
  blueMist: "#E9F0F9",
  blueHaze: "#BDD4EE",
  cream: "#F4F8FD",
  creamDeep: "#E4ECF7",
  border: "#BDD4EE",
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
        <td align="center" style="padding: 12px 0 4px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" bgcolor="${COLORS.primary}" style="border-radius: 9999px;">
                <a href="${ctaUrl}" target="_blank"
                   style="display: inline-block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 700; color: ${COLORS.white}; text-decoration: none; border-radius: 9999px; background-color: ${COLORS.primary};">
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
<body style="margin: 0; padding: 0; background-color: ${COLORS.blueMist}; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLORS.blueMist}; background-image: radial-gradient(60% 60% at 50% 0%, rgba(0, 120, 255, 0.28) 0%, rgba(0, 120, 255, 0) 70%), linear-gradient(180deg, #FFFFFF 0%, #E9F0F9 100%);">
    <tr>
      <td align="center" style="padding: 36px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: ${COLORS.white}; border-radius: 16px; overflow: hidden; border: 1px solid ${COLORS.blueHaze}; box-shadow: 0 4px 20px rgba(0, 91, 194, 0.08);">
          <tr>
            <td align="left" bgcolor="${COLORS.white}" style="background-color: ${COLORS.white}; background-image: radial-gradient(60% 80% at 20% 0%, rgba(0, 120, 255, 0.12) 0%, rgba(0, 120, 255, 0) 70%), linear-gradient(180deg, #FFFFFF 0%, #E9F0F9 100%); padding: 22px 32px; border-bottom: 1px solid ${COLORS.blueHaze}; text-align: left;">
              <img src="${LOGO_URL}" width="140" alt="SAMATECHS" style="display: block; width: 140px; max-width: 100%; height: auto; border: 0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 8px;">
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
            <td style="padding: 24px 32px 32px;">
              <hr style="border: none; border-top: 1px solid ${COLORS.blueHaze}; margin: 0 0 20px;" />
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${COLORS.muted};">
                SAMATECHS &middot; Strategic Advisory<br />
                <a href="${FRONTEND_URL}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600;">${FRONTEND_URL.replace(/^https?:\/\//, "")}</a>
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
