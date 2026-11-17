import { SendMailInput } from "./mailer";
import { CreateMeetingInput } from "./googleCalendar";
import prisma from "./prisma";

// Microsoft 365 app-only access. The selected mailbox must have an Exchange calendar
// and (for Teams links) a Teams license.
let cachedToken: { value: string; expiresAt: number } | undefined;
let cachedMailboxId: string | undefined;

export class GraphError extends Error {
  constructor(public status: number, public code: string | undefined, message: string) {
    super(message);
    this.name = "GraphError";
  }
}

function getConfig() {
  const { MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_MAILBOX } = process.env;
  if (!MICROSOFT_TENANT_ID || !MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !MICROSOFT_MAILBOX) {
    throw new Error("Microsoft tenant, client, secret and mailbox must be configured");
  }
  return { MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_MAILBOX };
}

async function getToken(): Promise<string> {
  const cfg = getConfig();
  if (!cachedToken || cachedToken.expiresAt <= Date.now() + 60000) {
    const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(cfg.MICROSOFT_TENANT_ID)}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: cfg.MICROSOFT_CLIENT_ID, client_secret: cfg.MICROSOFT_CLIENT_SECRET, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Microsoft token request failed (${response.status}): ${await response.text().catch(() => "")}`);
    const token = await response.json() as { access_token: string; expires_in: number };
    cachedToken = { value: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
  }
  return cachedToken.value;
}

/** Calls Graph. `path` is relative to /users/{userSegment} (defaults to the configured mailbox). */
async function graphRequest(path: string, body?: unknown, method: string = "POST", userSegment?: string): Promise<any> {
  const cfg = getConfig();
  const token = await getToken();
  const user = encodeURIComponent(userSegment ?? cfg.MICROSOFT_MAILBOX);
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${user}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    // Surface Graph's own error code/message — a bare "403" is impossible to diagnose.
    let code: string | undefined;
    let message = "";
    try {
      const err = await response.json() as { error?: { code?: string; message?: string } };
      code = err?.error?.code;
      message = err?.error?.message ?? "";
    } catch { /* non-JSON body */ }
    throw new GraphError(
      response.status,
      code,
      `Microsoft Graph ${method} ${path} failed (${response.status}${code ? ` ${code}` : ""})${message ? `: ${message}` : ""}`
    );
  }
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The /onlineMeetings API (app-only) expects the user's object ID, not a UPN/email. */
async function getMailboxObjectId(): Promise<string> {
  if (cachedMailboxId) return cachedMailboxId;
  if (process.env.MICROSOFT_MAILBOX_USER_ID) {
    cachedMailboxId = process.env.MICROSOFT_MAILBOX_USER_ID;
    return cachedMailboxId;
  }
  try {
    // Needs the User.Read.All application permission; /onlineMeetings rejects UPNs ("not a valid GUID").
    const user = await graphRequest("?$select=id", undefined, "GET");
    cachedMailboxId = user.id as string;
    return cachedMailboxId;
  } catch (err) {
    throw new Error(
      `Could not resolve the mailbox's object ID (${(err as Error).message}). ` +
      "Set MICROSOFT_MAILBOX_USER_ID to the user's Object ID from Entra ID, or grant the app User.Read.All."
    );
  }
}

/** Logs why Exchange might refuse to attach a Teams meeting to calendar events. */
async function logCalendarTeamsSupport(): Promise<void> {
  try {
    const calendar = await graphRequest(
      "/calendar?$select=allowedOnlineMeetingProviders,defaultOnlineMeetingProvider",
      undefined,
      "GET"
    );
    const providers: string[] = calendar?.allowedOnlineMeetingProviders ?? [];
    if (!providers.includes("teamsForBusiness")) {
      console.warn(
        `[microsoft] Mailbox calendar does not allow Teams meetings (allowedOnlineMeetingProviders=${JSON.stringify(providers)}). ` +
        "MICROSOFT_MAILBOX must be a licensed user (not a shared mailbox) with a Microsoft Teams license."
      );
    }
  } catch (err) {
    console.warn("[microsoft] Could not read calendar online-meeting settings:", (err as Error).message);
  }
}

// ---------------------------------------------------------------------------
// Delegated access (acting as the mailbox user via a refresh token).
// Creating Teams meetings this way needs no Teams "application access policy",
// which app-only access does. Set up once with `npm run microsoft:auth`.
// ---------------------------------------------------------------------------

export const MICROSOFT_DELEGATED_SCOPES = "offline_access User.Read OnlineMeetings.ReadWrite";
const REFRESH_TOKEN_KEY = "microsoft_refresh_token";
let delegatedToken: { value: string; expiresAt: number } | undefined;

// Microsoft rotates refresh tokens on every use and each one only lives ~90 days,
// so the newest one is kept in the database. Env is the initial seed.
async function loadStoredRefreshToken(): Promise<string | undefined> {
  try {
    const row = await prisma.integrationToken.findUnique({ where: { key: REFRESH_TOKEN_KEY } });
    return row?.value;
  } catch (err) {
    console.warn("[microsoft] Could not read stored refresh token:", (err as Error).message);
    return undefined;
  }
}

async function saveRefreshToken(value: string): Promise<void> {
  try {
    await prisma.integrationToken.upsert({
      where: { key: REFRESH_TOKEN_KEY },
      create: { key: REFRESH_TOKEN_KEY, value },
      update: { value },
    });
  } catch (err) {
    console.warn("[microsoft] Could not store rotated refresh token:", (err as Error).message);
  }
}

async function redeemRefreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; refresh_token?: string }> {
  const cfg = getConfig();
  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(cfg.MICROSOFT_TENANT_ID)}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.MICROSOFT_CLIENT_ID,
      client_secret: cfg.MICROSOFT_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: MICROSOFT_DELEGATED_SCOPES,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string; error_description?: string };
    throw new Error(`Microsoft refresh token rejected (${response.status} ${err.error ?? ""}): ${(err.error_description ?? "").split("\r\n")[0]}`);
  }
  return response.json() as any;
}

async function getDelegatedToken(): Promise<string> {
  if (delegatedToken && delegatedToken.expiresAt > Date.now() + 60000) return delegatedToken.value;

  const envToken = process.env.MICROSOFT_REFRESH_TOKEN;
  const stored = await loadStoredRefreshToken();
  // Try the newest (stored) token first; fall back to env, e.g. right after re-running microsoft:auth.
  const candidates = [...new Set([stored, envToken].filter((t): t is string => !!t))];
  if (candidates.length === 0) throw new Error("MICROSOFT_REFRESH_TOKEN is not configured");

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const token = await redeemRefreshToken(candidate);
      delegatedToken = { value: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
      if (token.refresh_token && token.refresh_token !== stored) await saveRefreshToken(token.refresh_token);
      return delegatedToken.value;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function createDelegatedTeamsMeeting(startTime: Date, end: Date, subject: string): Promise<string | null> {
  const token = await getDelegatedToken();
  const response = await fetch("https://graph.microsoft.com/v1.0/me/onlineMeetings", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDateTime: startTime.toISOString(), endDateTime: end.toISOString(), subject }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
    throw new Error(`POST /me/onlineMeetings failed (${response.status} ${err.error?.code ?? ""}): ${err.error?.message ?? ""}`);
  }
  const meeting = await response.json() as { joinWebUrl?: string; joinUrl?: string };
  return meeting.joinWebUrl || meeting.joinUrl || null;
}

/** Calendar event (app-only) that carries an already-created Teams link. */
async function createEventWithLink(input: CreateMeetingInput, end: Date, joinUrl: string): Promise<void> {
  try {
    await graphRequest("/events", {
      subject: input.summary,
      body: {
        contentType: "HTML",
        content: `${input.description ?? ""}<p><strong>Microsoft Teams meeting:</strong> <a href="${joinUrl}">${joinUrl}</a></p>`,
      },
      start: { dateTime: input.startTime.toISOString(), timeZone: "UTC" },
      end: { dateTime: end.toISOString(), timeZone: "UTC" },
      location: { displayName: "Microsoft Teams Meeting" },
    });
  } catch (err) {
    console.warn("[microsoft] Teams meeting created but calendar event failed:", (err as Error).message);
  }
}

export async function createMicrosoftMeeting(input: CreateMeetingInput): Promise<string | null> {
  if (process.env.NODE_ENV === "test") return null;
  const end = new Date(input.startTime.getTime() + (input.durationMinutes ?? 30) * 60000);

  if (process.env.MICROSOFT_REFRESH_TOKEN) {
    try {
      const joinUrl = await createDelegatedTeamsMeeting(input.startTime, end, input.summary);
      if (joinUrl) {
        await createEventWithLink(input, end, joinUrl);
        return joinUrl;
      }
    } catch (err) {
      console.warn("[microsoft] Delegated Teams meeting failed, trying app-only:", (err as Error).message);
    }
  }

  let event: any;
  try {
    event = await graphRequest("/events", {
      subject: input.summary,
      body: { contentType: "Text", content: input.description ?? "" },
      start: { dateTime: input.startTime.toISOString(), timeZone: "UTC" },
      end: { dateTime: end.toISOString(), timeZone: "UTC" },
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness",
    });
  } catch (err) {
    console.error("[microsoft] Failed to create calendar event:", err);
    return null;
  }

  if (event?.onlineMeeting?.joinUrl) return event.onlineMeeting.joinUrl;

  // Exchange often provisions the Teams meeting asynchronously: the POST response
  // comes back with onlineMeeting=null and the join link appears a moment later.
  if (event?.id) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await sleep(1000 + attempt * 500);
      try {
        const refreshed = await graphRequest(
          `/events/${encodeURIComponent(event.id)}?$select=onlineMeeting,isOnlineMeeting`,
          undefined,
          "GET"
        );
        if (refreshed?.onlineMeeting?.joinUrl) return refreshed.onlineMeeting.joinUrl;
      } catch (err) {
        console.warn("[microsoft] Re-fetching event for Teams link failed:", (err as Error).message);
        break;
      }
    }
  }

  console.warn("[microsoft] Event created without a Teams link. Trying /onlineMeetings fallback...");
  await logCalendarTeamsSupport();

  try {
    const userId = await getMailboxObjectId();
    const meeting = await graphRequest("/onlineMeetings", {
      startDateTime: input.startTime.toISOString(),
      endDateTime: end.toISOString(),
      subject: input.summary,
    }, "POST", userId);

    const joinUrl: string | undefined = meeting?.joinWebUrl || meeting?.joinUrl;
    if (joinUrl) {
      if (event?.id) {
        await graphRequest(`/events/${encodeURIComponent(event.id)}`, {
          body: {
            contentType: "HTML",
            content: `${input.description ?? ""}<p><strong>Microsoft Teams Link:</strong> <a href="${joinUrl}">${joinUrl}</a></p>`,
          },
          location: { displayName: "Microsoft Teams Meeting" },
        }, "PATCH").catch(() => {});
      }
      return joinUrl;
    }
  } catch (err) {
    const hint = err instanceof GraphError && err.status === 403
      ? " -> The app needs the OnlineMeetings.ReadWrite.All APPLICATION permission (admin-consented) AND a Teams application access policy granted to this mailbox (New-CsApplicationAccessPolicy + Grant-CsApplicationAccessPolicy)."
      : "";
    console.warn(`[microsoft] /onlineMeetings fallback failed: ${(err as Error).message}${hint}`);
  }

  return null;
}
