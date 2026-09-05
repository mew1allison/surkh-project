# SURKH — Step 5 execution checklist (5.1–5.3)

A copy-paste runbook for the fresh-project proof. **Nothing here has been run yet** — the
commands are for you to execute against a real Supabase project when you're ready.

**Path chosen: Option A — brand-new scratch project.** Because a fresh project cannot contain
duplicate `(facility_id, blood_group)` rows, the **5.3 dedupe guard is satisfied by default**
and you can skip it (the SQL is still included in §C in case you ever reuse an existing
project, e.g. the live `Surkh`).

All commands are PowerShell (Windows). Lines starting with `#` are comments. The Supabase CLI
(2.116.0) is confirmed installed and logged in on this machine.

---

## A. Preflight (no cloud calls)

### A1. Fix the env-file filename bug — REQUIRED

There is currently a file named `` backend/.env.local` `` (a **stray trailing backtick**). Next.js
loads a file named exactly `.env.local`, so the backticked one is **never read** and the backend
would boot with no config. Create/rename to the correct name:

```powershell
cd ..\..\..\surkh-project\backend      # adjust to repo location; end in backend\
# If you have real values in the backticked file, rename it (pick ONE):
Get-ChildItem -Force -Filter '.env.local*'    # should show: .env.local`
Rename-Item -LiteralPath '.env.local`' -NewName '.env.local'
```

Expected after: `Get-ChildItem -Force -Filter '.env.local'` lists exactly one file named
`.env.local` (no backtick). It stays gitignored (`backend/.gitignore` `.env*`).

### A2. Confirm the 4 real values are present (no hardcoded leaks elsewhere)

```powershell
Get-Content .env.local | Select-String -Pattern 'NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|SUPABASE_SECRET_KEY|GEMINI_API_KEY'
```

Expected: 4 keys present, with values from **your scratch project** (not the live `Surkh`
project). To switch projects, point `NEXT_PUBLIC_SUPABASE_URL` + the two keys at the new
project. `NEXT_PUBLIC_SUPABASE_URL` should be `https://<NEW-REF>.supabase.co` — note it must
NOT have a trailing `/rest/v1/` for the JS client; verify against `docs/api-contract.md`.

---

## B. Create the scratch project (Option A)

Pick ONE method. Both are interactive and billable — your call, your machine.

**B-1. Dashboard:** Supabase → New project → any name → region **Northeast Asia (Seoul)**
(matches the existing setup) → **set a strong database password and SAVE it** → Create and wait
for provisioning. Copy the **Project ref** and, under Project Settings → API, the URL /
publishable / secret keys into `.env.local` (A2).

**B-2. CLI** (creates under your logged-in org):

```powershell
npx supabase projects create surkh-scratch --region ap-northeast-2
# prompts for org + database password, then prints project ref + API keys
```

Expected: a new ref (e.g. `abcdefghijklm12`), status `ACTIVE_INTERNET_FACING`. Use that ref
below and put its keys in `.env.local`.

---

## C. 5.3 — pre-push dedupe guard  *(SKIP for a fresh Option-A project)*

Only needed if pushing to a project that may already hold data. Run in the **Supabase SQL
editor** on the target project:

```sql
select facility_id, blood_group, count(*)
from "Inventory" group by 1, 2 having count(*) > 1;
```

- **0 rows** → safe to push. Proceed to D.
- **Any rows** → the `inventory_facility_group_idx` unique index in
  `20260901000000_init_schema.sql` would abort the whole migration. Dedupe (keep the newest
  `id` per pair) or drop that index from the init migration before pushing.

For a brand-new scratch project this is **guaranteed empty** → skip.

---

## D. Provision the database

```powershell
cd ..\..\..\surkh-project\backend      # end in backend\
npx supabase link --project-ref <NEW-REF>     # interactive: DB password
npx supabase db push
```

Expected `db push` output (order is version-prefix sort):

```
Applying migration 20260901000000_init_schema.sql
Applying migration 20260903_allow_public_inventory_read.sql
Applying migration 20260904_facility_admin_insert.sql
Applying migration 202609040001_facility_select_grants.sql
Applying migration 20260905000000_reassert_single_source_of_truth.sql
Finished supabase db push.
```

`20260905000000_reassert_single_source_of_truth.sql` **must apply last** — it re-pins
`is_admin()` and drops the duplicate policies, so it is the final word.

Verify in SQL editor:

```sql
select count(*) from "Facility";                 -- expect 3
select relrowsecurity from pg_class where relname = 'Inventory';   -- expect true (RLS ON)
```

---

## E. Run the servers

```powershell
# Terminal 1
cd ..\..\..\surkh-project\backend
npm run dev                                   # http://localhost:3000

# Terminal 2
cd ..\..\..\surkh-project\frontend
python -m http.server 4321                    # http://localhost:4321 (any port works)
```

Expected: backend boots with no E900 (no `middleware.js` present — only `proxy.js`).

---

## F. 5.1 acceptance (browser at http://localhost:4321)

Run the config diagnostic first:

```powershell
curl http://localhost:3000/api/config
```

Expected JSON keys exactly: `supabaseUrl`, `supabasePublishableKey`, `databaseReady`,
`databaseError` — and **`databaseReady: true`**. If `false`, a `db push` step failed
(that's the diagnostic, not a code bug).

Then in the browser:

| # | Check | Expected |
|---| -----| -------- |
| 1 | Public search, `O+` + city filter | Renders the 3 demo facilities; "last updated" shown |
| 2 | Staff signup with facility code `LHR-001` | Signup succeeds (creates Profile via admin client) |
| 3 | Login as that staff account | Redirects to `dashboard.html` |
| 4 | Update a stock quantity on dashboard | Persists; `updated_at` moves forward = `inventory_touch` trigger works |
| 5 | AI Ledger Reader, upload a capture-slip image | Returns extracted rows (needs a valid `GEMINI_API_KEY`) |

Then confirm reset works end-to-end:

```powershell
npx supabase db reset
```

Expected: drops + re-applies all migrations, re-seeds demo data, and
`select count(*) from "Facility";` → **3**.

---

## G. 5.2 RLS regression (RLS is now OFF → ON, so test each role)

Because `db push` ENABLES RLS, confirm behavior per role (use the dashboard SQL editor as
anon via `/api/config`, or an authenticated session):

| Role | Expectation |
| ---- | ----------- |
| **anon** | Can `SELECT` `Inventory` + `Facility` (public search works); sees **0 rows** from `Profile` (table grant exists, no policy) |
| **Hospital Staff** | Reads/updates **only own** facility's `Inventory` (`my_facility_id()`); cannot read/update another facility's rows; `POST /api/facilities` → **403**; can create an `Exchange Request` only where `requester_facility_id` is own facility; provider-side accept/reject only when `provider_facility_id` is own facility |
| **Admin** | `POST` and `PATCH /api/facilities` succeed; can update any inventory row; can read every `Profile` |

Quick anon Profile check (SQL editor, run as `anon` role or via the public REST path):

```sql
-- as anon role
set role anon;
select count(*) from "Profile";   -- expect 0 rows (grant exists, no SELECT policy)
select count(*) from "Facility";  -- expect 3 (facility_read policy allows anon)
reset role;
```

**Do NOT add `force row level security`** — policies are `ENABLE`d, not `FORCE`d, so
`service_role` keeps bypassing RLS (the signup route inserts `Profile` with the admin client).

---

## Known loose ends (not blockers, pre-existing)

- `frontend/assets/icon-locate.svg`, `icon-connect.svg`, `icon-heart.svg` 404 on `index.html`.
- `O+` is pre-selected, so clicking it once deselects it.
