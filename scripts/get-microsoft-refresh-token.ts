/**
 * One-time setup: signs in as the mailbox user (e.g. connect@samatechs.com) and
 * obtains a Microsoft refresh token, so the backend can create Teams meetings
 * as that user. Delegated access like this does NOT need a Teams
 * "application access policy" (which requires Teams PowerShell).
 *
 * Prerequisites (Entra ID > App registrations > your app):
 *   1. Authentication > Add a platform > Web > Redirect URI:
 *        http://localhost:53683/callback
 *   2. API permissions > Add > Microsoft Graph > Delegated permissions:
 *        OnlineMeetings.ReadWrite, User.Read, offline_access
 *      then "Grant admin consent".
 *   3. MICROSOFT_TENANT_ID / MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET in .env.
 *
 * Usage: npm run microsoft:auth
 *   - Open the printed URL, sign in as the mailbox user, approve.
 *   - Copy the printed MICROSOFT_REFRESH_TOKEN line into .env and Vercel.
 */
import "dotenv/config";
import http from "http";
import { MICROSOFT_DELEGATED_SCOPES } from "../src/lib/microsoftGraph";

const PORT = 53683;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

async function main() {
  const { MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_MAILBOX } = process.env;
  if (!MICROSOFT_TENANT_ID || !MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
    console.error("Set MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in SamaTechBackend/.env first.");
    process.exit(1);
  }

  const authority = `https://login.microsoftonline.com/${encodeURIComponent(MICROSOFT_TENANT_ID)}/oauth2/v2.0`;
  const state = Math.random().toString(36).slice(2);
  const authUrl = `${authority}/authorize?` + new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    response_mode: "query",
    scope: MICROSOFT_DELEGATED_SCOPES,
    prompt: "select_account",
    state,
    ...(MICROSOFT_MAILBOX ? { login_hint: MICROSOFT_MAILBOX } : {}),
  });

  console.log(`\n1. Open this URL and sign in as ${MICROSOFT_MAILBOX ?? "the mailbox user"}:\n`);
  console.log(authUrl);
  console.log("\n2. Waiting for you to approve in the browser (times out in 5 minutes)...\n");

  const code = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => { server.close(); reject(new Error("Timed out waiting for authorization.")); }, 5 * 60 * 1000);
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", REDIRECT_URI);
      if (url.pathname !== "/callback") { res.statusCode = 404; res.end(); return; }
      const error = url.searchParams.get("error");
      const description = url.searchParams.get("error_description");
      const returnedCode = url.searchParams.get("code");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(error ? "Authorization failed - check the terminal." : "Authorization successful - you can close this tab.");
      clearTimeout(timeout);
      server.close();
      if (error) reject(new Error(`${error}: ${description ?? ""}`));
      else if (url.searchParams.get("state") !== state) reject(new Error("State mismatch - please try again."));
      else if (returnedCode) resolve(returnedCode);
      else reject(new Error("No authorization code received."));
    });
    server.listen(PORT);
  });

  const response = await fetch(`${authority}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      scope: MICROSOFT_DELEGATED_SCOPES,
    }),
  });
  const tokens = await response.json() as { access_token?: string; refresh_token?: string; error?: string; error_description?: string };
  if (!response.ok || !tokens.refresh_token) {
    console.error("\nToken exchange failed:", tokens.error, tokens.error_description ?? "(no refresh token returned)");
    process.exit(1);
  }

  const me = await fetch("https://graph.microsoft.com/v1.0/me?$select=userPrincipalName,mail", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  }).then((r) => r.json()).catch(() => ({})) as { userPrincipalName?: string; mail?: string };
  const signedInAs = me.mail ?? me.userPrincipalName ?? "unknown";
  console.log(`\nSigned in as: ${signedInAs}`);
  if (MICROSOFT_MAILBOX && signedInAs.toLowerCase() !== MICROSOFT_MAILBOX.toLowerCase()) {
    console.warn(`WARNING: this is not MICROSOFT_MAILBOX (${MICROSOFT_MAILBOX}). Teams meetings will be organised by ${signedInAs}.`);
  }

  console.log("\nSuccess! Add this line to SamaTechBackend/.env AND to Vercel's environment variables:\n");
  console.log(`MICROSOFT_REFRESH_TOKEN=${tokens.refresh_token}\n`);
}

main().catch((err) => {
  console.error("\nFailed:", err.message ?? err);
  process.exit(1);
});
