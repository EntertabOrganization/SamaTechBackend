import { google } from "googleapis";

/**
 * Creates a real Google Calendar event with an auto-generated Meet link, so
 * the customer and staff join the SAME meeting. The previous approach —
 * emailing everyone the static https://meet.google.com/new — doesn't work:
 * that URL mints a brand-new room on every visit, so each person who opens
 * it independently lands in a different meeting.
 *
 * Uses a real user's OAuth2 refresh token (not a service account — Google
 * Meet link creation for a personal Gmail account requires acting as that
 * user), obtained once via scripts/get-google-refresh-token.ts.
 *
 * No calendar invite is sent to attendees (sendUpdates: "none") — Aramway's
 * own branded emails are the single source of the meeting details; we don't
 * want Google's separate calendar-invite email arriving too.
 *
 * Falls back to null when not configured or on any failure, so the caller
 * can fall back to a static link — a booking must never fail because this
 * integration isn't set up.
 */

type OAuthClient = InstanceType<typeof google.auth.OAuth2>;

let oauthClientCache: OAuthClient | null | undefined;

function getOAuthClient(): OAuthClient | null {
  if (oauthClientCache !== undefined) return oauthClientCache;

  // Same rationale as mailer.ts: real credentials can end up in process.env
  // during tests as a side effect of unrelated imports (@prisma/client
  // auto-loads .env at require time) — automated tests must never be able
  // to create a real calendar event no matter how that happens.
  if (process.env.NODE_ENV === "test") {
    oauthClientCache = null;
    return oauthClientCache;
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    console.warn(
      "[googleCalendar] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REFRESH_TOKEN not fully configured — " +
        "consultations will use the static meet.google.com/new link instead of a real, shared meeting. " +
        "Run `npm run google:auth` to set this up."
    );
    oauthClientCache = null;
    return oauthClientCache;
  }

  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  oauthClientCache = client;
  return oauthClientCache;
}

export interface CreateMeetingInput {
  summary: string;
  description?: string;
  startTime: Date;
  durationMinutes?: number;
}

/** Returns a real, shared Google Meet link, or null if unconfigured / the request fails. */
export async function createMeetLink(input: CreateMeetingInput): Promise<string | null> {
  const auth = getOAuthClient();
  if (!auth) return null;

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const start = input.startTime;
    const end = new Date(start.getTime() + (input.durationMinutes ?? 30) * 60 * 1000);

    const res = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      conferenceDataVersion: 1,
      sendUpdates: "none",
      requestBody: {
        summary: input.summary,
        description: input.description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        conferenceData: {
          createRequest: {
            requestId: `consultation-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    return res.data.hangoutLink ?? null;
  } catch (err) {
    console.error("[googleCalendar] failed to create meeting:", err);
    return null;
  }
}
