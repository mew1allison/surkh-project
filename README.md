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

| Requirement          | Why                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Node.js **20.9+**    | Next.js 16 declares `engines.node >= 20.9.0`; older Node refuses to start `next dev`                            |
| **Docker Desktop**   | needed by the `npx supabase` database commands — the CLI starts a local Postgres 17 container to replay `supabase/migrations/` and `supabase/seed.sql`, then restores the result into your project. On Windows, use the WSL 2 backend. |
| Supabase project     | a **scratch** one — `db reset` drops the user tables in whatever database it targets                            |
| Python 3             | only for serving the static frontend (`python -m http.server`)                                                  |

Only **one** file carries credentials (`backend/.env.local`) and **one** command provisions
the database. The frontend needs no config file and runs on any port — it reads public
config from the backend's `GET /api/config` at runtime.

```bash
# 1. Backend + database  (Docker Desktop must be running)
cd backend
npm install                                        # also installs the Supabase CLI (npx supabase)
Copy-Item ../.env.example .env.local     # then fill in the 4 real values
npm run db:link -- --project-ref <YOUR-PROJECT-REF>   # Supabase login + DB password (interactive)
npm run db:reset -- --linked             # migrations + RLS + grants + mock data from seed.sql
npm run dev                              # http://localhost:3000

# 2. Frontend (new terminal) — any port works
cd frontend
python -m http.server 4321               # http://localhost:4321
```

`npm run db:reset -- --linked` (i.e. `npx supabase db reset --linked`) is what populates
**your own** project with the mock data: it wipes the linked database, re-applies every
migration, and then runs `supabase/seed.sql`. `npm run db:push` only applies missing
migrations and never runs `seed.sql`, so on a fresh clone it leaves you with the schema and
the three demo facilities baked into the init migration — not the full dataset.

Provision a fresh Supabase project from the dashboard first, or reuse one. If
`curl http://localhost:3000/api/config` returns `databaseReady: false`, the reset was
missed or failed. See `backend/README.md` for the full walkthrough.

## Data model

See `docs/schema.md` for full field definitions. Core tables: `facilities`, `inventory`. One row per blood group per facility.

## Team

Built by a 3-person team: frontend/product, backend, and AI integration, for the Bano Qabil AI Hackathon.
