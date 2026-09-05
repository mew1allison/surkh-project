# Surkh (سرخ)

Pakistan's Centralised Blood Emergency Distribution Grid — built for the Bano Qabil AI Hackathon 2026.

Surkh is a connective middleware layer, not a full blood bank management system. It gives citizens real-time visibility into which nearby facilities have blood in stock, and gives small, paper-based blood banks a way to get digitally visible without changing how they already work.

## Problem

Blood shortages in Pakistan are made worse by fragmentation — every hospital or blood bank operates as its own island, with no shared visibility. Families in crisis search hospital to hospital with no way to check stock beforehand. Smaller facilities without digital systems are invisible to any search entirely.

## What this build does

- **Public search** — find nearby facilities with a specific blood group in stock, with a "last updated" timestamp
- **Hospital dashboard** — facility staff view and update their own inventory
- **AI Ledger Reader** — facilities without a digital system log new donations by photographing a structured capture slip; a vision model extracts blood group, quantity, and date, with human confirmation before it's saved

Everything else in the original product vision (inter-hospital exchange, forecasting, donor integration, smart logistics) is documented as future scope, not built in this version.

## Tech stack

- Frontend: HTML, CSS & JavaScript
- Backend: Next.js + Supabase (Postgres)
- AI: Gemini API (vision extraction for the Ledger Reader)

## Repo structure

```
surkh/
├── docs/
│   ├── schema.md          → database field definitions, source of truth
│   └── api-contract.md    → endpoint definitions
├── frontend/
├── backend/
├── ai/
├── .gitignore
├── .env.example
└── README.md
```

## Branches

```
main       → stable, demo-ready
integration        → integration branch
frontend   → frontend developer's working branch
backend    → backend developer's working branch
ai         → AI integrator's working branch
```

## Local setup

### Requirements

| Requirement               | Why                                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Node.js 20.9+**         | Next.js 16 declares `engines.node >= 20.9.0` — install a current LTS before anything else                                                  |
| **Docker Desktop**        | running while you provision the database: the Supabase CLI replays `supabase/migrations/` and `supabase/seed.sql` in a local Postgres 17 container and restores the result into your project (WSL 2 backend on Windows) |
| **A Supabase project**    | create one from the dashboard (free tier is enough) — its URL and keys go in `backend/.env.local`, its ref in `db:link`                    |
| **Python 3**              | only to serve the static frontend on any port                                                                                             |

Only **one** file carries credentials (`backend/.env.local`) and **one** command provisions
the database.

### 1. Backend + database

```bash
# Docker Desktop running, from the repo root
cd backend
npm install                                         # app dependencies + the Supabase CLI
Copy-Item ../.env.example .env.local    # macOS/Linux: cp ../.env.example .env.local
# open backend/.env.local and fill in the 4 values from your Supabase project
npm run db:link -- --project-ref <YOUR-PROJECT-REF> # interactive: Supabase login + DB password
npm run db:reset -- --linked                        # schema + RLS + grants + mock data
npm run dev                                         # http://localhost:3000
```

`npm run db:reset -- --linked` (i.e. `npx supabase db reset --linked`) builds the database
end to end: it applies every migration in `supabase/migrations/`, then loads
`supabase/seed.sql` — 30 hospitals, their stock rows, and the `FAC-001 … FAC-030` codes. Run
it again whenever you want a clean, fully populated database.

### 2. Frontend (new terminal)

No config file and no fixed port — it reads public config from the backend's
`GET /api/config` at runtime.

```bash
cd frontend
python -m http.server 4321                           # http://localhost:4321
```

### 3. Check it worked

```bash
curl http://localhost:3000/api/config                # "databaseReady": true
```

Open http://localhost:4321 and search a blood group: the seeded facilities answer. For the
dashboards, sign up on `signup.html` with a seeded facility code (`FAC-001` … `FAC-030`) to
reach the staff dashboard, or use the reserved code `SURKH-ADMIN` and then **Admin Login** on
`login.html` to reach the network dashboard.

See `backend/README.md` for the full walkthrough.

## Data model

See `docs/schema.md` for full field definitions. Core tables: `facilities`, `inventory`. One row per blood group per facility.

## Team

Built by a 3-person team: frontend/product, backend, and AI integration, for the Bano Qabil AI Hackathon.
