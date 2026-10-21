# Integration verification — 22 October 2026

## Result

The implemented API, website forms, and dashboard workflows passed against an
isolated PostgreSQL 18 database, including a run against the compiled backend.
The configured server database could not be verified: TCP connections to the
saved `DATABASE_URL` host, `172.16.0.1:5432`, timed out, and Prisma could not reach it.
The server database was not migrated or seeded. Its connection string was preserved.

## Checks completed

| Area | Verification | Result |
| --- | --- | --- |
| Unit/API tests | Seven Jest suites, including malformed requests and authorization | 63 passed |
| Database/API/browser tests | Auth, contact, consultation, user management, availability, website, dashboard, Swagger | 14 passed |
| Fresh installation | Applied all six migrations to a second empty PostgreSQL database | Passed |
| Schema consistency | Compared the migrated database with `prisma/schema.prisma` | No differences |
| Production build | `npm run build`, Prisma client generation, clean compilation | Passed |
| Production Swagger | Checked the compiled specification and executed its UI | 18 operations; passed |

### Website and dashboard

- Submitted contact messages and consultation bookings from the website in both
  English and Arabic. Verified database-backed API responses and form success states.
- Verified contact organization, job title, and service values survive submission.
- Signed in through the dashboard and opened overview, messages, consultations,
  availability, users, and all content-editor routes.
- Opened the submitted messages, verified automatic READ status, marked them
  RESPONDED, and deleted them through the dashboard.
- Confirmed submitted consultation requests, marked them COMPLETED, and deleted them
  through the dashboard.
- Loaded and saved dashboard availability, verifying its exact time slots were preserved.
- Tested API user creation, duplicate rejection, login with the new user, and exclusion
  of password hashes from responses.
- Checked sequential duplicate booking rejection and that cancellation releases a slot.
- Checked unauthenticated access is rejected for every protected operation.
- Used Swagger's actual **Try it out / Execute** controls for public availability,
  login, current session, protected user listing, and logout.

All 18 documented method/path combinations were exercised across the API and
browser tests. Temporary test messages, bookings, and accounts were removed.
Browser integration used frontend development servers configured to call the
compiled backend at port 4002; this does not verify a deployed website or dashboard.

## Fixes made

1. Fixed the company/country migration: the initial migration already defines
   `Consultation.company`, so adding it unconditionally broke fresh installations.
   The migration now tolerates the column already existing.
2. Validated login and user fields before Prisma/bcrypt, returning 400 for malformed
   values instead of 500. Existing password characters are preserved.
3. Rejected fractional weekdays before availability changes reach the database.
4. Returned JSON 400 responses for malformed JSON and 413 for oversized bodies.
5. Cleaned `dist` before compiling. Old compiled files for retired modules previously
   caused production Swagger to advertise 42 operations instead of 18.
6. Generated the missing `JWT_SECRET` in the ignored local backend `.env` without
   displaying it. This does not configure the secret on a deployed server.
7. Added reusable request-validation, management API, and opt-in browser tests.

## Remaining blockers and feature gaps

- **Server database access:** supply a hostname/port reachable from this machine,
  or the necessary network route/tunnel. `172.16.0.1` is a private address. Retry
  connectivity, inspect migration history, and back up existing data before deployment.
  Do not reset the server database. The existing cleanup migration removes retired
  blog, category, career, and subscriber tables.
- **Content editing:** Homepage, Services, About, SEO, and Site settings forms open,
  but contain `TODO(backend)` placeholders and have no persistence handlers or
  corresponding content API. Saving these forms does not update the website.
- **Blocked dates:** the dashboard control is not connected to an API/model and
  does not prevent bookings.
- **Session duration:** the dropdown affects generated slot spacing, but the
  backend and website consultation duration remain fixed at 45 minutes; the
  selected duration is not persisted as a setting.
- **Live email and Google Calendar:** intentionally disabled for these tests through
  `NODE_ENV=test`. The current local `.env` has neither SMTP nor Google Calendar
  credentials, so delivery and real Meet-link generation were not verified.

## Repeating the checks

Use a separate PostgreSQL test database. Set `DATABASE_URL` for the test process,
apply migrations, and seed it. Start the backend with `NODE_ENV=test`, a test
`JWT_SECRET`, and a dedicated `PORT`; point both frontends' `NEXT_PUBLIC_API_URL`
at that backend. Set `WEBSITE_E2E_URL` and `DASHBOARD_E2E_URL` before running:

```powershell
node node_modules/jest/bin/jest.js --runInBand
node node_modules/@playwright/test/cli.js test
```

Without the two frontend URL variables, the two browser tests skip and the API
integration tests still run. Avoid using production data for this suite.
