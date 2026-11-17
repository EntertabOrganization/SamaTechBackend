import { renderEmailLayout } from "./layout";
import { escapeHtml } from "../utils/escapeHtml";
import { timeZoneLabel } from "../utils/consultationTime";

export function consultationCancellationEmail(params: { name: string; date: Date; time: string }) {
  const date = params.date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const time = `${escapeHtml(params.time)} (${escapeHtml(timeZoneLabel(params.date))})`;
  return {
    subject: "Your consultation with SAMATECHS has been cancelled",
    html: renderEmailLayout({
      preheader: `Your consultation scheduled for ${date} at ${time} has been cancelled.`,
      heading: "Your consultation has been cancelled",
      bodyHtml: `<p>Hi ${escapeHtml(params.name)},</p><p>Your consultation originally scheduled for <strong>${date}</strong> at <strong>${time}</strong> has been cancelled.</p><p>Please contact us if you would like to arrange another time.</p>`,
    }),
  };
}
