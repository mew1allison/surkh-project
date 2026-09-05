# Surkh backend

Next.js 16 App Router API + Supabase (Postgres). Serves on **http://localhost:3000**.

The backend is the single place that holds credentials. The static frontend and every
other consumer read public config from `GET /api/config` at runtime, so no Supabase URL,
key or port is hardcoded anywhere else.

## Setup (one file, one command)

Requirements: **Node.js 20.9+** (Next.js 16 `engines.node`), **Docker Desktop running**
for the `npx supabase` database commands, and a **scratch Supabase project** — `db reset`
drops the user tables in whichever database it targets. The Supabase CLI itself comes from
`npm install` (devDependency), so every command below can also be run as `npx supabase …`.

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

## Provision the database

Start Docker Desktop, then:

```bash
npm run db:link -- --project-ref <YOUR-PROJECT-REF>   # interactive: Supabase login + DB password
npm run db:reset -- --linked                          # npx supabase db reset --linked
```

`db:reset --linked` is the one that hands a fresh clone working demo data in **its own**
project: it drops the user entities in the linked database, re-applies every file in
`supabase/migrations/` in version-prefix order, and then executes `supabase/seed.sql` (the
facilities, inventory and profile rows). It is destructive and repeatable — run it again
whenever you want the mock data back.

`npm run db:push` is the incremental alternative: it applies only the migrations the remote
is still missing and **does not run `seed.sql`**, so a project provisioned that way gets just
the three demo facilities inserted by the init migration. To re-add the seed rows without
wiping anything, run `npx supabase db push --include-seed`.

The authoritative schema, RLS, grants and their inline demo data all live in
`supabase/migrations/20260901000000_init_schema.sql`; `20260905000000_reassert_single_source_of_truth.sql`
sorts last and is the final word on every push (it re-pins `is_admin()` and drops the
duplicate permissive policies the three legacy migrations re-add).

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
`window.SURKH_BACKEND_URL` or `?backend=`), so it runs on any port with zero config.

## CORS (`proxy.js`)

`backend/proxy.js` (Next 16 renamed the old `middleware.js` convention) centralises CORS
for all API routes. It echoes the caller's `Origin` when it is allowlisted and returns
`403` otherwise. By default it accepts loopback `5500`, `5501` and `4321`. Setting
`FRONTEND_ORIGINS` **replaces** that default list (it does not extend it).

> There must not be a `backend/middleware.js` alongside `proxy.js` — having both is a hard
> boot error (E900).

## API surface

See `../docs/api-contract.md`. Runtime public config is published by `GET /api/config`
which also returns a `databaseReady` boolean — the diagnostic for a missed or failed
provisioning step (`databaseReady: false` means the migrations were not applied).
