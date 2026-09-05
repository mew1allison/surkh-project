# Surkh backend

Next.js 16 App Router API + Supabase (Postgres). Serves on **http://localhost:3000**.

The backend is the single place that holds credentials. The static frontend and every
other consumer read public config from `GET /api/config` at runtime, so no Supabase URL,
key or port is hardcoded anywhere else.

## Requirements

| Requirement               | Why                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Node.js 20.9+**         | Next.js 16 declares `engines.node >= 20.9.0`                                                                                     |
| **Docker Desktop**        | running while you provision the database — `supabase db reset` replays the migrations and `supabase/seed.sql` in a local Postgres 17 container and restores the result into your project |
| **A Supabase project**    | created from the dashboard; its URL and keys go in `.env.local`, its ref goes in `db:link`                                       |
| **Supabase CLI**          | already installed by `npm install` as a devDependency, so every command below is also available as `npx supabase …`              |

## Setup — 1. credentials

```bash
cd backend
npm install
Copy-Item ../.env.example .env.local     # Windows PowerShell (macOS/Linux: cp ../.env.example .env.local)
# fill in the 4 real values in backend/.env.local
```

`backend/.env.local` keys (server-only unless prefixed `NEXT_PUBLIC_`):

| Key                                    | Where it comes from                                     |
| -------------------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → Data API → URL            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Data API → Publishable key (safe for browsers)          |
| `SUPABASE_SECRET_KEY`                  | Data API → Secret key (NEVER expose to the browser)     |
| `GEMINI_API_KEY`                       | https://aistudio.google.com/apikey (AI Ledger Reader)   |
| `FRONTEND_ORIGINS`                     | optional CORS allowlist — see below                     |

## Setup — 2. provision the database

With Docker Desktop running:

```bash
npm run db:link -- --project-ref <YOUR-PROJECT-REF>   # interactive: Supabase login + DB password
npm run db:reset -- --linked                          # npx supabase db reset --linked
```

That one command takes a project from empty to demo-ready. It applies every file in
`supabase/migrations/` in version-prefix order — schema, RLS policies, grants — and then runs
`supabase/seed.sql`, which loads the 30 hospitals, their inventory rows, and the
`FAC-001 … FAC-030` codes staff sign up against. Re-run it whenever you want the same clean,
fully populated state again.

The authoritative schema, RLS and grants live in
`supabase/migrations/20260901000000_init_schema.sql`; `20260905000000_reassert_single_source_of_truth.sql`
sorts last and is the final word on every push (it re-pins `is_admin()` and drops the
duplicate permissive policies the three legacy migrations re-add). `npm run db:push` is the
lighter variant: migrations only, no seed data.

## Run

```bash
npm run dev        # http://localhost:3000
```

Then, from the repo root, serve the static frontend on any port and open it:

```bash
cd ../frontend
python -m http.server 4321      # http://localhost:4321
```

The frontend derives the backend base from `location.hostname` (override with
`window.SURKH_BACKEND_URL` or `?backend=`), so it runs on any port with zero config. Search a
blood group to see the seeded stock; then sign up with `FAC-001` for the staff dashboard, or
with the reserved `SURKH-ADMIN` code and **Admin Login** for the network dashboard.

## CORS (`proxy.js`)

`backend/proxy.js` (Next 16 renamed the old `middleware.js` convention) centralises CORS
for all API routes. It echoes the caller's `Origin` when it is allowlisted and returns
`403` otherwise. By default it accepts loopback `5500`, `5501` and `4321`. Setting
`FRONTEND_ORIGINS` **replaces** that default list (it does not extend it).

> There must not be a `backend/middleware.js` alongside `proxy.js` — having both is a hard
> boot error (E900).

## API surface

See `../docs/api-contract.md`. Runtime public config is published by `GET /api/config`
which also returns a `databaseReady` boolean — the diagnostic for whether the provisioning
step above reached the database.
