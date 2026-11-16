# SamaTechs Backend

Express, TypeScript, and Prisma (PostgreSQL) API for the SamaTechs website.

## API

Interactive documentation: http://localhost:4000/api-docs

- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- User: `POST /api/users` and `GET /api/users`, both authenticated.
- Contact: public, rate-limited `POST /api/contact`; authenticated list, read, update, and delete.
- Consultations: public, rate-limited booking and public booked-slot endpoints; authenticated list, read, update, and delete.
- Availability: public weekly schedule; authenticated schedule replacement.

Authentication uses an httpOnly `token` cookie. Login and current-session responses
return `{ user: { id, email, name } }`. Password hashes are never returned.
List endpoints use `page` and `limit` and return `data` with pagination `meta`.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env`; configure PostgreSQL and `JWT_SECRET`.
3. Run `npx prisma migrate deploy` to apply checked-in migrations.
4. Run `npm run seed` to create the development user
   (`user@samatechs.com` / `User@1234`), sample contacts/consultations, and a
   default Sunday-to-Thursday booking schedule.
5. Run `npm run dev` (port 4000 by default).

Existing accounts are preserved: Prisma's `User` model maps to the existing
`Admin` table. Existing cookies and passwords continue to work. Clients must use
`/api/users` instead of `/api/admins`, and read `user` instead of `admin` from auth responses.

The cleanup migration removes the retired subscriber, blog, category, and career
tables and their data. Back up that data before applying migrations to an existing
database. Historical migrations are retained so fresh installations and deployed
databases follow the same migration history.

## Website integration

The website (`SamaTech`, Next.js) calls this API from the browser at
`NEXT_PUBLIC_API_URL` (default `http://localhost:4000`):

| Website feature | Endpoint |
| --- | --- |
| Contact → Message form | `POST /api/contact` with `name`, `email`, `organization`, `jobTitle`, `service` (area of interest), `message` |
| Contact → Book a time: open weekdays and times | `GET /api/availability` |
| Contact → Book a time: taken times on a day | `GET /api/consultations/booked?date=YYYY-MM-DD` |
| Contact → Book a time: confirm | `POST /api/consultations` with `name`, `email`, `company`, `notes`, `date`, `time` |

- Slots are in `CONSULTATION_TIME_ZONE` (default `Asia/Riyadh`, as the website states).
  `npm run seed` creates a Sunday-to-Thursday schedule when none exists; change it with `PUT /api/availability`.
- Errors are `{ error }` with 400 (invalid fields), 409 (slot not offered, passed, or just taken),
  or 429 (more than 20 form submissions per IP in 15 minutes).
- Contact messages are emailed to `CONTACT_NOTIFY_EMAIL` (or `CONSULTATION_NOTIFY_EMAIL`).

## Validation and production

- `npm test -- --runInBand`: unit/API tests with mocked Prisma; no database needed.
- `npx tsc --noEmit`: type checking.
- `npm run test:e2e`: real-database API tests; migrate and seed a test database first.
- `npm run build`: generate Prisma client and compile into `dist`.
- `npm start`: run compiled server.

The build clears `dist` before compilation so removed modules cannot leave stale
operations in production Swagger documentation.

Browser integration tests are opt-in. With a migrated and seeded **test database**,
start a backend with `NODE_ENV=test` (disables real email and Google Calendar calls)
and start both frontends with `NEXT_PUBLIC_API_URL` pointing to that backend. Set
`PORT` to its port, `WEBSITE_E2E_URL` and `DASHBOARD_E2E_URL` to the frontend origins,
then run `npm run test:e2e`. The browser tests submit messages and bookings in both
languages, manage those records in the dashboard, save availability, and execute
Swagger's public and authenticated operations. Test records are cleaned up.

SMTP and Google Calendar configuration remain available for consultation emails
and Meet links. See `.env.example` and `npm run google:auth`.

## Microsoft 365 mail and calendar

For a Microsoft 365 work or school mailbox, register an application in Microsoft Entra ID. Under Microsoft Graph **Application permissions**, add `Mail.Send` and `Calendars.ReadWrite` and have an administrator grant consent. Application permissions can cover mailboxes throughout the tenant; restrict the application to the intended mailbox using Exchange Online application RBAC. The mailbox needs an Exchange calendar and support for Teams online meetings.

Create a client secret and set these values in the backend environment (including in the deployed server, if applicable):

```env
MAIL_PROVIDER=microsoft
CALENDAR_PROVIDER=microsoft
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_CLIENT_ID=your-application-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_MAILBOX=staff@example.com
CONSULTATION_NOTIFY_EMAIL=staff@example.com
CONTACT_NOTIFY_EMAIL=staff@example.com
```

Restart the server. Graph sends email from the configured mailbox; `EMAIL_FROM` applies only to SMTP. New bookings create an event in that mailbox's default calendar and request a Teams join link, which is included in the existing confirmation emails. No attendee invitation is created. Microsoft accepts mail asynchronously, so acceptance does not guarantee delivery. Test with a real booking and contact message after configuring credentials.

This integration currently supports Microsoft 365 organizational accounts, not personal Outlook.com accounts. Creating a booking is best effort: if event creation fails or Teams provides no join link, the existing database default Google Meet placeholder is used; that placeholder does not create a shared meeting. Calendar events are not updated or deleted when staff edit or cancel a booking. Credentials are intentionally not included in this repository.

Microsoft documentation: https://learn.microsoft.com/en-us/graph/auth-v2-service and https://learn.microsoft.com/en-us/graph/outlook-calendar-online-meetings.
