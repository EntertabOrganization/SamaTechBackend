# Aramway Backend

Admin backend for the Aramway business-consultancy marketing site. Built with
Express, TypeScript, and Prisma (PostgreSQL). Persists and manages the five
visitor-facing flows from the Aramway frontend: newsletter subscribers,
blog/news content, career applications, contact-us messages, and
consultation bookings.

## Stack

- Express + TypeScript (`ts-node-dev` for local dev, `tsc` build to `dist/`)
- Prisma ORM (PostgreSQL)
- JWT auth (`jsonwebtoken`) stored in an httpOnly cookie, `bcryptjs` for
  password hashing
- `multer` for career-application file uploads (resume + cover letter)
- `swagger-jsdoc` + `swagger-ui-express` for interactive API docs
- `helmet`, `cors`, `morgan` for security/logging middleware
- Jest + `ts-jest` + Supertest + `jest-mock-extended` for unit tests (no
  live database required)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and fill in your own values:

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` to a real PostgreSQL connection string, and set a
   strong `JWT_SECRET`.

3. Generate the Prisma client (does not require a live database connection):

   ```bash
   npx prisma generate
   ```

4. Run the initial migration against your database (requires a live,
   reachable `DATABASE_URL`):

   ```bash
   npx prisma migrate dev --name init
   ```

5. Seed the database with a default admin user
   (`admin@example.com` / `Admin@1234`):

   ```bash
   npm run seed
   ```

6. Start the dev server:

   ```bash
   npm run dev
   ```

   The API is served under `/api`, and interactive Swagger docs are
   available at `http://localhost:4000/api-docs` (or whatever `PORT` you
   configured).

## Testing

Two separate test suites:

- **Unit tests** (`tests/`, Jest) mock the Prisma client (via
  `jest-mock-extended`), so they run without any database connection:

  ```bash
  npm test
  ```

- **API end-to-end tests** (`e2e/`, Playwright) run against the real Express
  app and a real, live `DATABASE_URL` — no mocking. `playwright.config.ts`
  starts the dev server for you and seeds nothing itself, so run migrations
  and `npm run seed` first:

  ```bash
  npx playwright install   # first time only (no browser needed, API-only tests)
  npm run test:e2e
  ```

  This is also what AramwayDashboard's own Playwright e2e suite depends on
  being up (`../AramwayDashboard`, `npm run dev` here first) since the
  dashboard now proxies every `app/api/**` route to this backend.

## Building for production

```bash
npm run build   # runs `prisma generate` then `tsc`
npm start       # runs the compiled dist/server.js
```

## Project structure

```
prisma/schema.prisma      Prisma schema (Admin, Subscriber, BlogCategory,
                           Blog, CareerApplication, ContactMessage,
                           Consultation)
prisma/seed.ts             Seeds the default admin user
src/app.ts                 Express app wiring (middleware, routes, docs)
src/server.ts               Entry point
src/lib/prisma.ts           Prisma client singleton
src/middleware/             auth, error handling, file upload middleware
src/swagger/swagger.ts      swagger-jsdoc configuration
src/utils/                  JWT helpers, async handler, pagination, ApiError
src/modules/<name>/         One folder per resource: routes/controller/service
uploads/                    Uploaded resumes & cover letters (gitignored)
tests/                      One Jest test file per module + test helpers
```

## API modules

All endpoints are namespaced under `/api`. Public endpoints (used by the
Aramway frontend) are unauthenticated; everything else requires a valid
`token` cookie obtained via `POST /api/auth/login`.

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `POST /api/subscribers` (public), full CRUD (protected)
- `blog-categories` full CRUD (protected)
- `blogs` full CRUD (protected), filterable by `type`, `categoryId`,
  `status`; `GET /api/blogs/public` and `GET /api/blogs/public/:slug`
  (public) list/read `PUBLISHED` blogs only, for the Aramway frontend
- `POST /api/careers` (public, `multipart/form-data` with `resume` and
  `coverLetter` files), list/get/update/delete (protected)
- `POST /api/contact` (public), list/get/update/delete (protected)
- `POST /api/consultations` (public), list/get/update/delete (protected)

All list endpoints accept `?page=&limit=` (defaults: `page=1`, `limit=20`)
and return `{ data, meta: { total, page, limit, totalPages } }`.

Full request/response schemas for every endpoint are documented via Swagger
at `/api-docs`.
