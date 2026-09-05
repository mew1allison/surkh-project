# Surkh — Database Schema (source of truth)

Postgres on Supabase. Table names are capitalized and must be double-quoted in raw SQL.
The authoritative definition is `backend/supabase/migrations/20260901000000_init_schema.sql`
(idempotent); `20260905000000_reassert_single_source_of_truth.sql` runs last on every
`db push` and is the final word. This document mirrors those files — update them together.

## Facility

| Field           | Type          | Notes                                   |
| --------------- | ------------- | --------------------------------------- |
| `id`            | bigint        | identity, primary key                   |
| `name`          | text          | not null                                |
| `city`          | text          | not null (search filter)                |
| `location`      | text          | not null                                |
| `facility_code` | text          | **unique** — staff type this at signup   |
| `latitude`      | numeric(9,6)  |                                         |
| `longitude`     | numeric(9,6)  |                                         |
| `has_emr`       | boolean       | not null, default false                 |
| `created_at`    | timestamptz   | not null, default now()                 |

## Inventory

| Field            | Type        | Notes                                                  |
| ---------------- | ----------- | ------------------------------------------------------ |
| `id`             | bigint      | identity, primary key                                  |
| `facility_id`    | bigint      | FK → Facility(id) on delete cascade                    |
| `blood_group`    | text        | not null                                               |
| `quantity`       | integer     | not null, default 0                                    |
| `expiry_date`    | date        |                                                        |
| `status`         | text        | not null, default `available` (`available`\|`low`\|`not available`) |
| `component_type` | text        | e.g. `Whole Blood`                                     |
| `created_at`     | timestamptz | not null, default now()                                |
| `updated_at`     | timestamptz | not null, default now() — maintained by trigger (below) |

- **Unique index `inventory_facility_group_idx` on `(facility_id, blood_group)`** — one row
  per blood group per facility; `/api/inventory` relies on this to merge stock.
- **Trigger `inventory_touch`** (`before update`) calls `public.touch_updated_at()` to set
  `updated_at = now()`. No route sets `updated_at` by hand; the UI's "last updated" reads it.

## Profile

| Field         | Type        | Notes                                              |
| ------------- | ----------- | -------------------------------------------------- |
| `id`          | uuid        | PK, FK → `auth.users(id)` on delete cascade        |
| `full_name`   | text        | not null                                           |
| `email`       | text        | not null                                           |
| `role`        | text        | not null, default `Hospital Staff` (`Hospital Staff`\|`Admin`) |
| `facility_id` | bigint      | FK → Facility(id)                                  |
| `created_at`  | timestamptz | not null, default now()                            |

Cannot be seeded via SQL (FK to `auth.users`); the first account is created through
`POST /api/auth/signup` and promoted to Admin by hand.

## Exchange Request

| Field                   | Type        | Notes                                  |
| ----------------------- | ----------- | -------------------------------------- |
| `id`                    | bigint      | identity, primary key                  |
| `requester_facility_id` | bigint      | FK → Facility(id) on delete cascade    |
| `provider_facility_id`  | bigint      | FK → Facility(id) on delete cascade    |
| `blood_group`           | text        | not null                               |
| `quantity`              | integer     | not null                               |
| `status`                | text        | not null, default `pending`            |
| `requested_by`          | uuid        | FK → Profile(id)                       |
| `created_at`            | timestamptz | not null, default now()                |

## Helper functions (SECURITY DEFINER, `set search_path = public`)

- `is_admin()` — true when the calling `auth.uid()` has `Profile.role = 'Admin'`. Reads
  `Profile` past its own RLS.
- `my_facility_id()` — the caller's `Profile.facility_id`; scopes every staff-row policy.

Both are pinned with `set search_path = public`; the reassert migration re-applies the pin
because the legacy `20260904_facility_admin_insert.sql` overwrote `is_admin()` without it.

## Row Level Security

RLS is **ENABLED** (not `FORCE`d) on all four tables so `service_role` still bypasses it —
the signup route inserts `Profile` rows with the admin client. No `DELETE` policy or grant
exists because no code path deletes; that is by design.

| Table            | Role(s)          | Access                                                                 |
| ---------------- | ---------------- | ---------------------------------------------------------------------- |
| Facility         | anon, auth       | SELECT all (`facility_read`)                                           |
| Facility         | authenticated    | INSERT / UPDATE only when `is_admin()`                                 |
| Inventory        | anon, auth       | SELECT all (`inventory_read`) — public search is intentionally open    |
| Inventory        | authenticated    | INSERT / UPDATE only when `is_admin()` or `facility_id = my_facility_id()` |
| Profile          | authenticated    | SELECT own row or (if admin) all; **anon sees 0 rows** (no policy)     |
| Exchange Request | authenticated    | SELECT when admin or own facility is requester/provider                |
| Exchange Request | authenticated    | INSERT when `requester_facility_id = my_facility_id()`                 |
| Exchange Request | authenticated    | UPDATE when admin or `provider_facility_id = my_facility_id()`         |

Table-level `GRANT`s (root cause of the old `42501`s) sit under the policies:
`usage` on schema `public` and `select` on all four tables to `anon, authenticated`;
`insert, update` on `Inventory` and `Exchange Request` to `authenticated`.

## Demo data

Seeded inside the init migration (not `seed.sql`, which only runs on `db reset`), so a bare
`db push` is instantly demo-able: 3 facilities (KHI-001, LHR-001, PES-001) with one
Inventory row per blood group each. `select count(*) from "Facility"` → 3.
