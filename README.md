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

- Frontend: React (PWA — installable, offline-aware)
- Backend: Node/Express + Supabase (Postgres)
- AI: Gemini API (vision extraction for the Ledger Reader)

## Repo structure

```
surkh/
├── docs/
│   ├── schema.md          → database field definitions, source of truth
│   └── api-contract.md    → endpoint definitions
├── frontend/
├── backend/
├── .gitignore
├── .env.example
└── README.md
```

## Branches

```
main       → stable, demo-ready
dev        → integration branch
frontend   → frontend developer's working branch
backend    → backend developer's working branch
ai         → AI integrator's working branch
```

Work happens on individual branches, merges into `dev` once tested, `dev` merges into `main` only when stable.

## Local setup

1. Clone the repo
2. Copy `.env.example` to `.env` in both `frontend/` and `backend/`, fill in real values (ask a teammate for keys — never commit `.env`)
3. Backend: `cd backend && npm install && npm run dev`
4. Frontend: `cd frontend && npm install && npm run dev`

## Data model

See `docs/schema.md` for full field definitions. Core tables: `facilities`, `inventory`. One row per blood group per facility — not arrays.

## Team

Built by a 3-person team: frontend/product, backend, and AI integration, for the Bano Qabil AI Hackathon.
