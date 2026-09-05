# SURKH — Step 5 Handoff (Supabase setup simplification)

Audience: the agent picking this up after Steps 1–4. Read this before touching anything.

## Definition of done (the whole 5-step task)

One file typed (`backend/.env.local`), one command provisions the DB (`npm run db:push`),
no hardcoded Supabase URL / key / port anywhere in `frontend/` or `backend/app`, and the
static frontend runs on **any** port.

## State: Steps 1–4 are COMPLETE on disk (uncommitted)

| Step | Artifacts                                                                                                                                                                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `backend/supabase/migrations/20260901000000_init_schema.sql` (schema + RLS + grants + demo data, idempotent), `backend/supabase/config.toml`, `db:link` / `db:push` / `db:reset` scripts + `supabase` devDependency in `backend/package.json` (CLI verified installed: 2.116.0) |
| 1b   | `backend/supabase/migrations/20260905000000_reassert_single_source_of_truth.sql` — **not in the original work order**; see deviations                                                                                                                                           |
| 2    | `backend/proxy.js` (was `middleware.js`), `backend/app/api/auth/signup/route.js` CORS removed, root `.env.example` rewritten, root `.gitignore` extended                                                                                                                        |
| 3    | `backend/app/api/config/route.js` — public runtime config + `databaseReady` probe                                                                                                                                                                                               |
| 4    | `frontend/supabaseClient.js` → `window.SURKH_READY`; every consumer in `script.js`, `dashboard.html`, `admin-dashboard.html` awaits it; `supabaseClient.js` added to `index.html` + `signup.html`                                                                               |

### Deviations from the work order (intentional — do not "fix" them back)

1. **`backend/middleware.js` no longer exists.** Next 16 deprecated the `middleware`
   convention; it is now `backend/proxy.js` with `export function proxy(request)`.
   Keeping both files is a hard boot error (E900). Any command/grep in the work order
   naming `backend/middleware.js` must target `backend/proxy.js`.
2. **`/api/config` returns no `backendBase`** — it was the Supabase host, mislabeled, and
   already inside `supabaseUrl`. Response keys are exactly:
   `supabaseUrl`, `supabasePublishableKey`, `databaseReady`, `databaseError`.
3. **`DEFAULT_ORIGINS` in `proxy.js` includes loopback 5500, 5501 and 4321** so Step 4's
   `python -m http.server 4321` acceptance works. Setting `FRONTEND_ORIGINS` _replaces_
   that list entirely (it does not extend it).
4. **Step 1's claim that the 3 legacy migrations "no-op" was wrong.** They each re-add
   objects the init migration owns, and `20260904_facility_admin_insert.sql` runs _after_
   init and overwrote `is_admin()` with a version lacking `set search_path = public`.
   `20260905000000_reassert_single_source_of_truth.sql` re-pins that function and drops
   the 3 duplicate permissive policies. It sorts last, so it is the final word on every push.
5. **Prettier churn**: the user's IDE reformats whole files on save. `signup/route.js`,
   `script.js` and `admin-dashboard.html` therefore carry large cosmetic diffs
   (admin-dashboard.html: 2756 changed lines for a 15-line edit). Functionally neutral.

### Verified already (no need to redo)

- Preflight behaviour of the proxy: `OPTIONS` with `Origin: http://localhost:5500` → 204
  with that exact origin echoed + `Vary: Origin`; `http://evil.test` → 403, no ACAO;
  `GET /api/facilities` with no `Origin` passes through.
- `/api/config`: 500 + guidance message with no env; with real public values →
  `databaseReady: true`; with a broken key → `databaseReady: false` + message (HTTP 200).
- Browser run at `http://localhost:4321` (backend on 3000): city dropdown populated,
  O+/Rawalpindi search rendered 3 facility cards, `login.html` stayed, both dashboards
  redirected to `login.html`, no JS errors. Grep for `localhost:|supabase.co|sb_publishable`
  in `frontend/` and `backend/app` → 0 matches.

### NOT verified (Step 5's job)

- Steps 1, 4 and 5 were never run against a **provisioned** database. The live shared
  project `fpvlbkdcqmcatvxhuzta` still has **RLS off**, so all post-Step-1 authorization
  behaviour is untested.
- Authenticated flows (stock edit, exchange requests, ledger reader, admin CRUD) were not
  exercised — they need `SUPABASE_SECRET_KEY` and a real login.

---

## Step 5 — execute in this order

### 5.3 FIRST: pre-push data check on the live project (destructive-index guard)

The new unique index `inventory_facility_group_idx` on `("Inventory"(facility_id,
blood_group))` **aborts the whole migration** if duplicates already exist. Run in the
Supabase SQL editor on `fpvlbkdcqmcatvxhuzta` before pushing there:

```sql
select facility_id, blood_group, count(*)
from "Inventory" group by 1, 2 having count(*) > 1;
```

Dedupe (keep the newest `id` per pair) or drop the index from the init migration if the
live data can't be cleaned. A brand-new scratch project cannot have duplicates — skip
this check there.

### 5.1 Fresh-project proof (the acceptance test for the entire task)

```powershell
# Supabase dashboard: New project. Then in backend/:
cd backend
npm install                                   # already done once, safe to repeat
Copy-Item ../.env.example .env.local          # fill 4 values + optionally FRONTEND_ORIGINS
npx supabase link --project-ref <NEW-REF>     # interactive: login + DB password
npx supabase db push                          # provisions schema + RLS + grants + demo data
npm run dev                                   # :3000
cd ../frontend
python -m http.server 4321
```

Then confirm in the browser at `http://localhost:4321`: public search returns the 3 demo
facilities; staff signup with code `LHR-001` succeeds; login reaches `dashboard.html`;
a stock update persists (check `updated_at` moved — that's the `inventory_touch` trigger);
the AI ledger reader returns extracted rows (needs `GEMINI_API_KEY`).
Also confirm `supabase db reset` works end-to-end and `select count(*) from "Facility"` → 3.

`databaseReady: false` from `curl http://localhost:3000/api/config` is the diagnostic for a
missed or failed `db push`.

### 5.2 RLS regression — RLS flips OFF → ON, so test each role explicitly

| Role           | Expectation                                                                                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| anon           | can `SELECT` `Inventory` + `Facility` (public search works); sees **0 rows** from `Profile` (table grant exists, no policy)                                                                                                                                                                                              |
| Hospital Staff | can read/update **only own** facility's `Inventory` (`my_facility_id()`); cannot read or update another facility's rows; `POST /api/facilities` → 403; can create an `Exchange Request` only where `requester_facility_id` is own facility; provider-side accept/reject only when `provider_facility_id` is own facility |
| Admin          | `POST` and `PATCH /api/facilities` succeed; can update any inventory row; can read every `Profile`                                                                                                                                                                                                                       |

Note: policies are `ENABLE`d, not `FORCE`d — `service_role` must keep bypassing RLS because
the signup route inserts `Profile` rows with the admin client. Do not add `force row level
security`. No code path issues `DELETE`, so no delete grants exist — that is by design.

### 5.4 Rotate keys

`sb_publishable_jJ_I0osFLEfqcjR2t3tz8A_3DsYKPwE` is in git history (working tree is clean of
secrets — verified). Rotate it in Supabase → API Settings, audit history for any `sk_` /
service-role value, and re-check `git log -p --all | Select-String 'sb_secret|sk_'`.

### 5.5 Docs

Replace the boilerplate `backend/README.md` and the root README "Local setup" section with
Steps 1–5 as executed (using `proxy.js`, not `middleware.js`), and update `docs/schema.md`
to include `city`, `facility_code`, `component_type`, `updated_at` and the
`inventory_touch` trigger so it stays the source of truth.

## Residual manual steps (the CLI cannot do these — report them honestly)

- `supabase link` prompts for interactive login and the **database password**.
- `Profile` rows cannot be seeded in SQL (`id` FKs `auth.users`), so the first account must
  come from `POST /api/auth/signup`, then be promoted by hand:
  `update "Profile" set role = 'Admin' where email = '…';` (or Authentication → Users).
- `config.toml` `project_id` is filled by `supabase link`; `[auth] site_url` is still
  `http://localhost:5500` and only matters if you later use hosted Auth redirects.

## Known loose ends

- `frontend/assets/icon-locate.svg`, `icon-connect.svg`, `icon-heart.svg` 404 on `index.html`
  (pre-existing, unrelated to this task).
- `O+` is pre-selected in the search form, so clicking it once deselects it (pre-existing UX).
- Signup/login/dashboard/admin flows still need a live authenticated pass in 5.1/5.2.
