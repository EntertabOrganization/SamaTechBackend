import { SendMailInput } from "./mailer";
import { CreateMeetingInput } from "./googleCalendar";

// Microsoft 365 app-only access. The selected mailbox must have an Exchange calendar.
let cachedToken: { value: string; expiresAt: number } | undefined;

async function graphRequest(path: string, body: unknown): Promise<any> {
  const { MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_MAILBOX } = process.env;
  if (!MICROSOFT_TENANT_ID || !MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !MICROSOFT_MAILBOX) {
    throw new Error("Microsoft tenant, client, secret and mailbox must be configured");
  }
  if (!cachedToken || cachedToken.expiresAt <= Date.now() + 60000) {
    const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(MICROSOFT_TENANT_ID)}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: MICROSOFT_CLIENT_ID, client_secret: MICROSOFT_CLIENT_SECRET, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Microsoft token request failed (${response.status})`);
    const token = await response.json() as { access_token: string; expires_in: number };
    cachedToken = { value: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
  }
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(MICROSOFT_MAILBOX)}${path}`, {
    method: "POST", headers: { Authorization: `Bearer ${cachedToken.value}`, "Content-Type": "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Microsoft Graph request failed (${response.status})`);
  return response.status === 202 || response.status === 204 ? undefined : response.json();
}

export async function sendMicrosoftMail(input: SendMailInput): Promise<void> {
  const recipient = (address: string) => ({ emailAddress: { address } });
  await graphRequest("/sendMail", { message: {
    subject: input.subject, body: { contentType: "HTML", content: input.html },
    toRecipients: (Array.isArray(input.to) ? input.to : [input.to]).map(recipient),
    ...(input.replyTo ? { replyTo: [recipient(input.replyTo)] } : {}),
  } });
}

export async function createMicrosoftMeeting(input: CreateMeetingInput): Promise<string | null> {
  if (process.env.NODE_ENV === "test") return null;
  try {
    const end = new Date(input.startTime.getTime() + (input.durationMinutes ?? 30) * 60000);
    const event = await graphRequest("/events", {
      subject: input.summary, body: { contentType: "Text", content: input.description ?? "" },
      start: { dateTime: input.startTime.toISOString(), timeZone: "UTC" },
      end: { dateTime: end.toISOString(), timeZone: "UTC" },
      isOnlineMeeting: true, onlineMeetingProvider: "teamsForBusiness",
    });
    if (!event.onlineMeeting?.joinUrl) console.error("[microsoft] Event created without a Teams join link; check the mailbox's Teams support.");
    return event.onlineMeeting?.joinUrl ?? null;
  } catch (err) {
    console.error("[microsoft] Failed to create calendar event:", err);
    return null;
  }
}
