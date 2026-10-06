# RideShare

A **multi-organization ride-sharing platform** for colleges and companies. Users can create rides, send/accept requests, and coordinate via real-time chat — gated behind verified organization email domains (or general accounts for gmail.com users).

---

## Repository Structure

```
ride_share/
├── backend/                  # Node.js + Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.js           # Dev seed: allowed domain + super admin
│   ├── src/
│   │   ├── config/           # DB connection, constants
│   │   ├── controllers/      # Route handlers
│   │   ├── jobs/             # Cron jobs (ride cleanup)
│   │   ├── middleware/       # Auth, validation, rate limiting, error handling
│   │   ├── routes/           # Express routers
│   │   ├── services/         # Business logic
│   │   ├── sockets/          # Socket.io event handlers
│   │   ├── utils/            # JWT, OTP, response, domain helpers
│   │   ├── validations/      # Zod schemas
│   │   └── server.js         # Entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # React 19 + Vite + Tailwind CSS v4 SPA
│   ├── public/
│   ├── src/
│   │   ├── components/       # Navbar, Footer, RideCard, ProtectedRoute
│   │   ├── context/          # AuthContext, ToastContext
│   │   ├── layouts/          # MainLayout
│   │   ├── pages/            # Home, Login, Register, CreateRide, Request, Chat, Profile, …
│   │   ├── services/         # Axios API client, Socket.io client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── admin-panel/              # React 19 + Vite + Tailwind CSS v4 admin dashboard
│   ├── src/
│   │   ├── pages/            # Dashboard, Users, Rides, Admins, Domains, Settings, …
│   │   ├── components/       # DataTable, Sidebar
│   │   ├── context/          # AuthContext (admin JWT)
│   │   └── lib/              # Axios API client, token store
│   └── package.json
│
├── docs/
│   └── api.md                # Full REST API reference
│
├── .gitignore
├── package.json              # Monorepo root (optional scripts)
└── README.md
```

---

## Tech Stack

| Layer      | Technology                                                                                |
| ---------- | ----------------------------------------------------------------------------------------- |
| Frontend   | React 19, Vite, Tailwind CSS v4, React Router v8, Axios, Socket.io-client, date-fns        |
| Admin      | React 19, Vite, Tailwind CSS v4, Recharts, framer-motion                                   |
| Backend    | Node.js ≥ 18.11, Express 4, Socket.io 4, Prisma 5 (ORM)                                    |
| Database   | PostgreSQL                                                                                |
| Auth       | JWT (access + refresh tokens, separate user/admin secrets), bcryptjs, OTP via email        |
| Email      | Resend API (primary), Brevo API (fallback)                                                 |
| Validation | Zod (backend), Axios interceptors (frontend)                                              |
| Jobs       | node-cron (expired ride cleanup, health checks)                                            |

---

## Prerequisites

- **Node.js** ≥ 18.11 (the backend dev server uses the built-in `node --watch`)
- **PostgreSQL** running locally or a hosted instance (e.g. Supabase, Railway)
- A **Resend** account _or_ a **Brevo** account for email delivery (OTP signup/reset mails)
- `npm` or `yarn`

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-org/ride_share.git
cd ride_share

# Backend deps
cd backend && npm install

# Frontend deps
cd ../frontend && npm install

# Admin panel deps
cd ../admin-panel && npm install
```

> Tip: `npm install` at the repo root installs **backend + frontend** in one go
> (both are npm workspaces). The admin panel has its own lockfile, so install it
> separately as shown above.

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env — fill in DATABASE_URL, JWT secrets, email keys, etc.
```

Optional (frontend): `cd frontend && cp .env.example .env` for AdSense / SEO settings.

See [Environment Variables](#environment-variables) for a full description of every key.

### 3. Set up the database

```bash
cd backend

# Create all tables from schema.prisma (safe on a fresh database;
# also generates the Prisma client)
npx prisma db push

# Seed the allowed email domain + the super-admin admin account
# (dev only — refuses to run when NODE_ENV=production)
npm run seed
```

The seed prints a **one-time randomly generated admin password** to the console —
save it (it is not stored anywhere). Defaults and overrides:

| Env var                  | Default                  | Purpose                       |
| ------------------------ | ------------------------ | ----------------------------- |
| `SEED_ADMIN_DOMAIN`      | `yourcollege.ac.in`      | Allowed (ACTIVE) signup domain |
| `SEED_SUPER_ADMIN_EMAIL` | `superadmin@example.local` | Admin panel login email      |

Re-running the seed is safe: it never duplicates rows, but it **rotates** the
admin password and prints the new one.

### 4. Start development servers

```bash
# Terminal 1 – backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 – frontend (http://localhost:5173)
cd frontend && npm run dev

# Terminal 3 – admin panel (http://localhost:5174)
cd admin-panel && npm run dev
```

Open **http://localhost:5173** (app) and **http://localhost:5174** (admin panel,
sign in with the seeded super-admin email + printed password).

---

## Environment Variables

All variables live in `backend/.env`. Copy `backend/.env.example` and fill in the values.

| Variable                 | Required | Description                                                    |
| ------------------------ | -------- | -------------------------------------------------------------- |
| `DATABASE_URL`           | ✅       | PostgreSQL connection string                                   |
| `JWT_SECRET`             | ✅       | Access token signing secret (min 32 chars)                     |
| `JWT_REFRESH_SECRET`     | ✅       | Refresh token signing secret (min 32 chars)                    |
| `JWT_ADMIN_SECRET`       | prod ✅  | Admin access secret — MUST differ from `JWT_SECRET`            |
| `JWT_ADMIN_REFRESH_SECRET` | prod ✅ | Admin refresh secret — MUST differ from `JWT_REFRESH_SECRET`   |
| `JWT_EXPIRES_IN`         | optional | Access token TTL (default `15m`)                               |
| `JWT_REFRESH_EXPIRES_IN` | optional | Refresh token TTL (default `7d`)                               |
| `RESEND_API_KEY`         | ✅       | Primary email API key from [resend.com](https://resend.com) — at least one of Resend/Brevo is needed to deliver OTPs |
| `BREVO_API_KEY`          | optional | Fallback email API key from [app.brevo.com](https://app.brevo.com) |
| `EMAIL_FROM`             | optional | Sender address shown in emails                                 |
| `PORT`                   | optional | Backend port (default `5000`)                                  |
| `NODE_ENV`               | optional | `development` \| `production`                                  |
| `FRONTEND_URL`           | ✅       | Frontend origin(s) for CORS/cookies (e.g. `http://localhost:5173`) |
| `ADMIN_PANEL_URL`        | optional | Admin panel origin(s) for CORS/cookies (default `http://localhost:5174`) |
| `RATE_LIMIT_WINDOW_MS`   | optional | Rate limit window in ms (default `900000` = 15 min)            |
| `RATE_LIMIT_MAX`         | optional | Max requests per window (default `100`)                        |
| `OTP_RATE_LIMIT_MAX`     | optional | Max OTP requests per window (default `5`)                      |
| `SEED_ADMIN_DOMAIN`      | optional | Seed override: allowed (ACTIVE) domain created by `npm run seed` (default `yourcollege.ac.in`) |
| `SEED_SUPER_ADMIN_EMAIL` | optional | Seed override: super-admin email created by `npm run seed` (default `superadmin@example.local`) |

> **Allowed email domains are stored in the database**, not in an env var.
> The seed creates the first one; manage the rest from the admin panel
> (Super Admin → Domains).

---

## Available Scripts

### Backend (`/backend`)

| Command                       | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `npm run dev`                 | Start with auto-restart (`node --watch`)           |
| `npm start`                   | Start in production mode                           |
| `npm run prisma:push`        | Sync `schema.prisma` → database (`npx prisma db push`; creates tables on a fresh DB) |
| `npm run prisma:generate`     | Regenerate Prisma client                           |
| `npm run prisma:studio`       | Open Prisma Studio GUI                             |
| `npm run prisma:reset`        | Wipe the DB and re-apply `schema.prisma` (dev only) |
| `npm run seed`                | Seed allowed domain + super admin (dev only, prints a one-time password) |

### Frontend (`/frontend`)

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start Vite dev server                |
| `npm run build`   | Production build (output to `dist/`) |
| `npm run preview` | Preview the production build locally |

### Admin Panel (`/admin-panel`)

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start Vite dev server (port 5174)    |
| `npm run build`   | Production build (output to `dist/`) |
| `npm run lint`    | Run oxlint                           |
| `npm run preview` | Preview the production build locally |

---

## Key Features

- **Domain-gated access** — only email domains marked *ACTIVE* in the admin panel can register (gmail.com general accounts always allowed)
- **OTP verification** — email OTP required before account creation and password reset
- **JWT auth** — short-lived access tokens (15 min) with rotating refresh tokens (7 days); server-side revocation via DB
- **Ride management** — create rides with date/time/vehicle/seats, auto-expire past rides via cron
- **Request flow** — riders request to join; owner accepts/rejects; phone number optionally shared on acceptance
- **Real-time chat** — Socket.io room per accepted request; REST fallback also available
- **Domain isolation** — rides are scoped to the user's email domain so multi-institution deployments stay separated
- **Rate limiting** — global limiter + dedicated OTP limiter to prevent abuse

---

## Architecture Overview

```
Browser (React SPA)
      │  REST (Axios)          WebSocket (Socket.io-client)
      ▼                                  ▼
Express API  ──────────────────  Socket.io Server
      │
      ├─ Auth middleware (JWT verify)
      ├─ Zod validation middleware
      ├─ Rate limit middleware
      │
      ├─ /api/auth       ← send-otp, verify-otp, register, login, refresh, logout, forgot/reset-password
      ├─ /api/rides      ← CRUD rides (auth required)
      ├─ /api/requests   ← create, list, accept/reject, share-phone (auth required)
      ├─ /api/chats      ← chat info, message history, send message (auth required)
      ├─ /api/profile    ← get/update profile, change password (auth required)
      └─ /api/admin      ← admin panel: users, rides, domains, admins, reports, settings (admin JWT)
            │
            ▼
       Prisma ORM
            │
            ▼
       PostgreSQL
```

---

## API Reference

See [`docs/api.md`](docs/api.md) for the complete REST API documentation with request/response examples.

---

## Deployment

### Backend (e.g. Railway / Render / EC2)

1. Set all environment variables in the platform dashboard (including the
   distinct `JWT_ADMIN_SECRET` / `JWT_ADMIN_REFRESH_SECRET` values — startup
   aborts in production if they are missing or shared with the user secrets)
2. Run `npm run prisma:push` (in `backend/`) to sync `schema.prisma` to the database
3. Start with `npm start`

For Render's sleeping web services, configure an external monitor or a Render
Cron Job to request `https://<your-backend-domain>/health` every 10 minutes.
For a Render Cron Job using this repository, set `HEALTH_URL` to that URL and
use `npm run health:ping` as its start command.
The in-process 15-minute health job only runs while Node is already running;
it cannot wake a sleeping instance. Set `HEALTH_ALERT_EMAIL` (or
`ADMIN_EMAIL`) and `RESEND_API_KEY` or `BREVO_API_KEY` to receive health and
unregistered-domain notifications.

### Frontend (e.g. Vercel / Netlify)

1. Set `VITE_API_URL` if your backend is on a different origin and update `api.js` accordingly
2. Run `npm run build` — the `dist/` folder is the deployable artifact
3. Configure the hosting platform to serve `index.html` for all routes (SPA fallback)

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/my-feature`
2. Commit your changes with a clear message
3. Open a Pull Request — describe what changes you made and why

---

## License

MIT © NIT yourcity RideShare Project
