# Resource Reservation Management System

A full-stack web app for PrimeWave Lab's internship assessment. It gives an organization one
place to register shared resources (rooms, equipment, vehicles), reserve them without
double-booking, and see how they are being used.

**Stack:** Next.js 15 (App Router) · TypeScript · PostgreSQL (`pg`, no ORM) · Zod · plain CSS

## Features

- **Resources** – create, edit, categorize, activate/deactivate (location, capacity, description)
- **Reservations** – book a time slot, view/filter (resource, upcoming/past, status), cancel, paginated
- **Availability** – pick a resource and date and see booked and free slots before submitting
- **Dashboard** – active resources, what is in use right now, upcoming bookings, hours booked per resource (30 days)
- **Conflict prevention** – overlapping reservations of the same resource are impossible (see below)

## Setup

Requirements: Node.js ≥ 20.6, Docker (or any PostgreSQL 14+ instance).

```bash
npm install
cp .env.example .env          # adjust DATABASE_URL if not using docker-compose
docker compose up -d          # starts PostgreSQL on :5432 (skip if you have your own)
npm run db:setup              # creates tables + loads demo data
npm run dev                   # http://localhost:3000
```

Other scripts: `npm run db:migrate` (schema only), `npm run db:seed` (demo data only),
`npm run typecheck`, `npm run build && npm start`.

## Architecture

```
src/
  app/            Next.js App Router: pages (server components) + /api route handlers
  components/     Client components (forms, buttons)
  server/
    repositories/ SQL only (ResourceRepository, ReservationRepository, ...)
    services/     Business rules (ResourceService, ReservationService, DashboardService)
    container.ts  Wires repositories into services
  lib/            db pool, error types, validation (Zod), HTTP helpers, formatting
db/               schema.sql, seed.sql
```

Layering: **route/page → service (rules + validation) → repository (SQL)**. Route handlers stay thin
and every error becomes a consistent JSON response (400 validation, 404 not found, 409 conflict).

## Key engineering decisions

1. **Double-booking is prevented by the database.** `reservations` has a PostgreSQL exclusion
   constraint (`btree_gist` + `tstzrange(start, end, '[)')`) so concurrent requests cannot both win.
   The service also pre-checks to return a friendly message listing the clashing bookings, and
   maps the constraint error to the same 409 if two requests race. Back-to-back bookings
   (10:00–11:00 then 11:00–12:00) are allowed.
2. **Cancel, don't delete.** Reservations get `status = cancelled` so history/usage stays accurate;
   the exclusion constraint only applies to `confirmed` rows, so a cancelled slot is free again.
3. **Business rules in the service layer:** end after start, 15 min – 12 h duration, no bookings
   in the past, resource must be active, a resource with upcoming bookings can't be deactivated.
4. **Raw SQL via `pg`** instead of an ORM so the exclusion constraint and range queries are explicit.
5. **Times** are stored as `timestamptz` (UTC) and sent as ISO strings. Forms use the browser's
   local time; display uses `NEXT_PUBLIC_APP_TIMEZONE` (default `Asia/Colombo`).

## API

| Method      | Path                                        | Purpose                                                     |
| ----------- | ------------------------------------------- | ----------------------------------------------------------- |
| GET         | `/api/categories`                           | List categories                                             |
| GET / POST  | `/api/resources`                            | List (`?includeInactive=true&categoryId=`) / create         |
| GET / PATCH | `/api/resources/:id`                        | Get / update (incl. `isActive`)                             |
| GET         | `/api/resources/:id/availability?from=&to=` | Bookings + free slots in an ISO range (≤ 31 days)           |
| GET / POST  | `/api/reservations`                         | List (`resourceId, status, scope, page, pageSize`) / create |
| GET         | `/api/reservations/:id`                     | Get one                                                     |
| POST        | `/api/reservations/:id/cancel`              | Cancel                                                      |
| GET         | `/api/dashboard`                            | Summary + per-resource usage                                |

Example:

```bash
curl -X POST localhost:3000/api/reservations -H 'Content-Type: application/json' -d '{
  "resourceId": 1, "title": "Planning", "userName": "Nimali", "userEmail": "nimali@example.com",
  "startTime": "2026-10-20T04:00:00Z", "endTime": "2026-10-20T05:00:00Z"
}'
```

## Database design

See [docs/ER_DIAGRAM.md](docs/ER_DIAGRAM.md) (Mermaid source – paste into mermaid.live for a shareable link).

Entities: `resource_categories` 1–N `resources` 1–N `reservations` N–1 `users`.

## Known limitations / next steps

- No authentication: users are identified by the email entered on the booking form. In production
  add login and role-based permissions (e.g. only owners or admins can cancel).
- No recurring reservations, approval workflow or email notifications.
- No automated tests yet; the conflict logic in `ReservationService` is the first place to cover.
