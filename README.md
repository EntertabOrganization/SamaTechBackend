# SamaTechs Backend

Express, TypeScript, and Prisma (PostgreSQL) API for the SamaTechs website.

## API

Interactive documentation: http://localhost:4000/api-docs

- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- User: `POST /api/users` and `GET /api/users`, both authenticated.
- Contact: public `POST /api/contact`; authenticated list, read, update, and delete.
- Consultations: public booking and available-slot endpoints; authenticated list, read, update, and delete.
- Availability: public weekly schedule; authenticated schedule replacement.

Authentication uses an httpOnly `token` cookie. Login and current-session responses
return `{ user: { id, email, name } }`. Password hashes are never returned.
List endpoints use `page` and `limit` and return `data` with pagination `meta`.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env`; configure PostgreSQL and `JWT_SECRET`.
3. Run `npx prisma migrate deploy` to apply checked-in migrations.
4. Run `npm run seed` to create the development user
   (`user@samatechs.com` / `User@1234`) and sample contacts/consultations.
5. Run `npm run dev` (port 4000 by default).

Existing accounts are preserved: Prisma's `User` model maps to the existing
`Admin` table. Existing cookies and passwords continue to work. Clients must use
`/api/users` instead of `/api/admins`, and read `user` instead of `admin` from auth responses.

The cleanup migration removes the retired subscriber, blog, category, and career
tables and their data. Back up that data before applying migrations to an existing
database. Historical migrations are retained so fresh installations and deployed
databases follow the same migration history.

The frontend currently posts bookings to `/api/booking` with placeholder slots;
connecting it to `/api/consultations` and live availability is a separate frontend task.

## Validation and production

- `npm test -- --runInBand`: unit/API tests with mocked Prisma; no database needed.
- `npx tsc --noEmit`: type checking.
- `npm run test:e2e`: real-database API tests; migrate and seed a test database first.
- `npm run build`: generate Prisma client and compile into `dist`.
- `npm start`: run compiled server.

SMTP and Google Calendar configuration remain available for consultation emails
and Meet links. See `.env.example` and `npm run google:auth`.
