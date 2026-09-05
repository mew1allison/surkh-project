-- Single source of truth: schema + RLS + grants + demo data. Idempotent.
create table if not exists "Facility" (
  id bigint generated always as identity primary key,
  name text not null, city text not null, location text not null,
  facility_code text unique,                       -- staff type this at signup
  latitude numeric(9,6), longitude numeric(9,6),
  has_emr boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists "Profile" (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null, email text not null,
  role text not null default 'Hospital Staff',     -- 'Hospital Staff' | 'Admin'
  facility_id bigint references "Facility"(id),
  created_at timestamptz not null default now()
);
create table if not exists "Inventory" (
  id bigint generated always as identity primary key,
  facility_id bigint references "Facility"(id) on delete cascade,
  blood_group text not null, quantity integer not null default 0,
  expiry_date date,
  status text not null default 'available',        -- available | low | 'not available'
  component_type text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists "Exchange Request" (
  id bigint generated always as identity primary key,
  requester_facility_id bigint references "Facility"(id) on delete cascade,
  provider_facility_id  bigint references "Facility"(id) on delete cascade,
  blood_group text not null, quantity integer not null,
  status text not null default 'pending',
  requested_by uuid references "Profile"(id),
  created_at timestamptz not null default now()
);

-- Repair columns the older shared project may lack, so one push serves both.
alter table "Facility"         add column if not exists city text;
alter table "Facility"         add column if not exists has_emr boolean not null default false;
alter table "Inventory"        add column if not exists component_type text;
alter table "Inventory"        add column if not exists updated_at timestamptz not null default now();
alter table "Exchange Request" add column if not exists requested_by uuid;

-- routes/inventory/route.js merges stock per (facility, group); enforce the invariant.
create unique index if not exists inventory_facility_group_idx
  on "Inventory" (facility_id, blood_group);

-- No route sets updated_at; the UI's "last updated" depends on this trigger.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists inventory_touch on "Inventory";
create trigger inventory_touch before update on "Inventory"
  for each row execute function public.touch_updated_at();

-- SECURITY DEFINER so they can read "Profile" past its own RLS.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from "Profile" where id = auth.uid() and role = 'Admin')
$$;
create or replace function public.my_facility_id()
returns bigint language sql stable security definer set search_path = public as $$
  select facility_id from "Profile" where id = auth.uid()
$$;

-- ENABLE (not FORCE): service_role must still bypass — the signup route inserts
-- Profiles with the admin client. This is the step the repo never had.
alter table "Facility"         enable row level security;
alter table "Inventory"        enable row level security;
alter table "Profile"          enable row level security;
alter table "Exchange Request" enable row level security;

drop policy if exists "facility_read" on "Facility";
create policy "facility_read" on "Facility" for select
  to anon, authenticated using (true);
-- The 'authenticated' half above is new: without it the Inventory→Facility
-- embedded join silently returns no Facility for logged-in dashboard calls.
drop policy if exists "facility_admin_insert" on "Facility";
create policy "facility_admin_insert" on "Facility" for insert
  to authenticated with check (is_admin());
drop policy if exists "facility_admin_update" on "Facility";
create policy "facility_admin_update" on "Facility" for update
  to authenticated using (is_admin());

drop policy if exists "inventory_read" on "Inventory";
create policy "inventory_read" on "Inventory" for select
  to anon, authenticated using (true);        -- public search is intentionally open
drop policy if exists "inventory_insert_own_facility" on "Inventory";
create policy "inventory_insert_own_facility" on "Inventory" for insert
  to authenticated with check (is_admin() or facility_id = my_facility_id());
drop policy if exists "inventory_update_own_facility" on "Inventory";
create policy "inventory_update_own_facility" on "Inventory" for update
  to authenticated using (is_admin() or facility_id = my_facility_id());

drop policy if exists "profile_read_own" on "Profile";
create policy "profile_read_own" on "Profile" for select
  to authenticated using (id = auth.uid() or is_admin());

drop policy if exists "exchange_read_own" on "Exchange Request";
create policy "exchange_read_own" on "Exchange Request" for select
  to authenticated using (is_admin()
    or requester_facility_id = my_facility_id()
    or provider_facility_id  = my_facility_id());
drop policy if exists "exchange_create_own" on "Exchange Request";
create policy "exchange_create_own" on "Exchange Request" for insert
  to authenticated with check (requester_facility_id = my_facility_id());
drop policy if exists "exchange_update_provider" on "Exchange Request";
create policy "exchange_update_provider" on "Exchange Request" for update
  to authenticated using (is_admin() or provider_facility_id = my_facility_id());

-- Table-level GRANTs the policies sit on top of (root cause of the old 42501s).
grant usage on schema public to anon, authenticated;
grant select on "Facility", "Inventory", "Profile", "Exchange Request" to anon, authenticated;
grant insert, update on "Inventory", "Exchange Request" to authenticated;

-- In-migration (NOT seed.sql — that only runs on `db reset`) so a bare
-- `db push` is instantly demo-able.
insert into "Facility" (name, city, location, facility_code, latitude, longitude, has_emr) values
  ('Pakistan Red Crescent Blood Bank','Karachi','Cantonment','KHI-001',24.8607,67.0011,false),
  ('Punjab Regional Centre of Blood','Lahore','Johar Town','LHR-001',31.4697,74.2728,false),
  ('Hayatabad Medical Complex Blood Bank','Peshawar','Hayatabad','PES-001',34.0151,71.5710,false)
on conflict (facility_code) do nothing;

insert into "Inventory" (facility_id, blood_group, quantity, expiry_date, status, component_type)
select f.id, g.blood_group, g.quantity, current_date + 30,
  case when g.quantity = 0 then 'not available'
       when g.quantity <= 10 then 'low' else 'available' end, 'Whole Blood'
from "Facility" f
cross join (values ('O+',25),('A+',18),('B+',12),('AB+',4),('A-',7),('O-',0))
  as g(blood_group, quantity)
where f.facility_code in ('KHI-001','LHR-001','PES-001')
on conflict (facility_id, blood_group) do nothing;
