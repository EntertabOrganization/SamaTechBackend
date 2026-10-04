/**
 * One-time setup: obtains a Google OAuth refresh token so the backend can
 * create real Google Calendar events (with an auto-generated Meet link) as
 * a specific Gmail account, without needing that account's password stored
 * anywhere.
 *
 * Prerequisites (Google Cloud Console — https://console.cloud.google.com):
 *   1. Create a project (or use an existing one).
 *   2. APIs & Services > Library > enable the "Google Calendar API".
 *   3. APIs & Services > Credentials > Create Credentials > OAuth client ID
 *      > Application type "Desktop app". Copy the Client ID and Client
 *      Secret into AramwayBackend/.env as GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.
 *   4. If prompted to configure an OAuth consent screen first, choose
 *      "External", fill in the required fields, and add the Gmail account
 *      you'll authorize below as a "test user" (this keeps the app out of
 *      Google's review process, which isn't needed for internal use).
 *
 * Usage: npm run google:auth
 *   - Opens a URL for you to visit and sign in with the Gmail account that
 *     should own the meetings (felmola13@gmail.com).
 *   - After you approve, paste the resulting GOOGLE_REFRESH_TOKEN line into
 *     AramwayBackend/.env.
 */
import "dotenv/config";
import http from "http";
import { google } from "googleapis";

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

async function main() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error(
      "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in AramwayBackend/.env first " +
        "(from a Google Cloud OAuth 'Desktop app' client) — see the comment at the top of this script."
    );
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });

  console.log("\n1. Open this URL, sign in with the Gmail account that should own the meetings, and approve access:\n");
  console.log(authUrl);
  console.log("\n2. Waiting for you to approve in the browser (this will time out in 5 minutes)...\n");

  const code = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for authorization."));
    }, 5 * 60 * 1000);

    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", REDIRECT_URI);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      res.end(
        error
          ? "Authorization failed — you can close this tab and check the terminal."
          : "Authorization successful — you can close this tab and return to the terminal."
      );

      clearTimeout(timeout);
      server.close();
      if (error) reject(new Error(error));
      else if (code) resolve(code);
      else reject(new Error("No authorization code received."));
    });

    server.listen(PORT);
  });

  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      "\nNo refresh token was returned. This usually means this Gmail account already authorized this " +
        "exact app before — go to https://myaccount.google.com/permissions, remove access for this app, " +
        "then run this script again.\n"
    );
    process.exit(1);
  }

  console.log("\nSuccess! Add this line to AramwayBackend/.env:\n");
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
}

main().catch((err) => {
  console.error("\nFailed:", err.message ?? err);
  process.exit(1);
});
