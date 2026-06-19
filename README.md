# PulseGuard AI

AI-powered **self-healing cybersecurity infrastructure**. PulseGuard detects threats, diagnoses root causes with AI, auto-executes recovery playbooks, and narrates everything with voice — a futuristic security copilot wrapped in a premium enterprise UI.

![stack](https://img.shields.io/badge/Next.js-15-black) ![ts](https://img.shields.io/badge/TypeScript-5-blue) ![tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8) ![supabase](https://img.shields.io/badge/Supabase-Auth-3ecf8e)

## Features

- **Premium landing page** — Linear/Vercel-class hero, animated dashboard preview, role spotlight, CTA flows
- **Enterprise authentication** — Supabase email/password signup + login, password strength meter, secure HTTP-only session cookies via `@supabase/ssr`
- **Role-based access control** — `admin` / `engineer` / `viewer` enforced in middleware, API routes, **and** the Postgres layer via Row-Level Security
- **Protected dashboard routes** — middleware redirects unauthenticated visitors to `/login`, and signed-in users away from `/login`+`/signup`
- **AI System Health Dashboard** — personalized greeting, live health score, MTTR/MTTD, threat level, AI confidence
- **AI SRE Agent + Incident Analyzer** — OpenAI-powered grounded analysis with offline rule-engine fallback
- **Self-healing recovery engine** — auto-runs Backup Mode / Read-Only / Cache Mode / Rate Limit playbooks
- **Chaos Center** — inject failures end-to-end (admin/engineer only)
- **Live metrics, executive risk, copilot, recommendations, autonomous actions, replay**, and more
- **PDF export** of incident reports
- **Dark mode** by default, glassmorphism, framer-motion animations, neon status indicators

## Tech Stack

Next.js 15 (App Router) · TypeScript · TailwindCSS · ShadCN-style UI · Framer Motion · Recharts · Zustand · Supabase Auth + Postgres + RLS · `@supabase/ssr` for cookie-based sessions · OpenAI · Browser Speech Synthesis

## Getting Started

```bash
npm install
cp .env.example .env.local   # add OpenAI + Supabase keys
npm run dev
```

Open <http://localhost:3000>. The app works **out of the box** with no keys (full demo mode — no auth gate, in-memory store). To unlock real auth, set the Supabase env vars below.

## Authentication setup

### 1. Create a Supabase project

Grab your URL + anon key + service-role key from <https://supabase.com/dashboard>.

### 2. Configure `.env.local`

```env
# Required for auth
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Server-only — used by `npm run seed:users`. NEVER expose with NEXT_PUBLIC_.
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Optional
OPENAI_API_KEY=
```

### 3. Apply the schema

In Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). This creates:

- `public.profiles` table with `admin | engineer | viewer` role enum
- Auto-create trigger on `auth.users` so a profile row is created on every signup
- Row-Level Security policies (self-read/update, admin-read-all)
- `public.incidents` table with role-gated RLS (engineers+admins can write, admins can delete)

### 4. Seed the demo users (optional)

```bash
npm run seed:users
```

This idempotently creates three demo accounts with password `Demo!2026`:

| Email                          | Role     | Permissions                                                    |
| ------------------------------ | -------- | -------------------------------------------------------------- |
| `admin@pulseguard.ai`          | admin    | Manage users · approve autonomous actions · run chaos · reset  |
| `engineer@pulseguard.ai`       | engineer | Run analyzer · trigger recovery playbooks · run chaos          |
| `viewer@pulseguard.ai`         | viewer   | Read-only dashboards & reports                                 |

Override the password by setting `DEMO_PASSWORD=...` before running the script.

### 5. Sign in

- Visit `/login` and pick a demo account chip (autofills credentials), or
- Create your own via `/signup` (set your role at signup time)

## Security model

- **No service-role key in the browser.** Only `NEXT_PUBLIC_*` env vars reach the client. The service-role key is used solely by the seed script.
- **Server-side session checks** via `@supabase/ssr` cookies — middleware (`src/middleware.ts`) refreshes the session and redirects unauthenticated requests.
- **API route guards** (`src/lib/api-auth.ts` → `guardApi({ role })`) protect `/api/cyber/analyze`, `/api/agent`, `/api/analyze`, and the auth routes.
- **Row-Level Security** at the database layer: even if a token leaks, RLS policies prevent privilege escalation.
- **Password strength validation** on signup (length + character classes, with live meter).

## Routes

| Path           | Visibility    | Description                                                   |
| -------------- | ------------- | ------------------------------------------------------------- |
| `/`            | Public        | Landing page (hero · features · roles · CTA)                  |
| `/login`       | Public *      | Sign-in form                                                  |
| `/signup`      | Public *      | Account creation with role selection                          |
| `/dashboard`   | Protected     | Operations dashboard (was previously at `/`)                  |
| `/analyzer`    | Protected     | Incident analyzer (cyber)                                     |
| `/chaos`       | Protected     | Chaos Center (admin+engineer only for actions)                |
| `/reports`     | Protected     | Recovery & cyber reports (PDF export)                         |
| `/security`    | Protected     | Security intelligence                                         |
| `/settings`    | Protected     | Account, voice, integrations, demo controls                   |
| `/incidents`, `/recovery`, `/intelligence`, `/copilot`, `/executive`, `/autonomous`, `/replay` | Protected | Specialized ops modules |

\* Authenticated users hitting `/login` or `/signup` are redirected to `/dashboard`.

## Architecture

```
src/
  app/            Next.js routes
    api/auth/     login · signup · logout · profile
    api/cyber/    cyber-analyzer endpoint (auth-gated)
    dashboard/    Protected operator dashboard
    login/, signup/   Auth pages with their own glass shell
    page.tsx      Public landing page
  components/
    auth/         AuthShell · LoginForm · SignupForm · UserMenu · PasswordStrength
    layout/       AppShell · Sidebar · Topbar · PageHeader
    ui/           Button · Card · Badge · Input · Label · Select · …
  features/       Operational modules (dashboard, incidents, recovery, …)
  hooks/          useVoice · useMetricsTicker
  lib/
    auth-context.tsx   Client AuthProvider + useAuth()
    api-auth.ts        guardApi() helper for route handlers
    supabase/          client.ts · server.ts · middleware.ts · auth-helpers.ts
    store.ts           Zustand operator state
  middleware.ts        Route gate (redirects on auth state)
  types/auth.ts        Role · Profile · PERMISSIONS map
supabase/schema.sql    profiles + RLS + auto-profile trigger + incidents
scripts/seed-demo-users.mjs   One-shot demo-user seeder (service role)
```

## Demo Script

1. Open <http://localhost:3000> → premium landing page.
2. Click **Sign in** → tap the `admin@pulseguard.ai` chip → **Sign in**.
3. You land on `/dashboard` with a personalized greeting.
4. Hit **Run Disaster Scenario** in the topbar — watch the full self-heal flow.
5. Open the user menu (top-right) → **Sign out** → routed back to `/login`.
6. Sign in as `viewer@pulseguard.ai` to see role-gated buttons disable.

## Build

```bash
npm run build   # 22 routes, including /, /login, /signup, /dashboard, /api/auth/*
```

