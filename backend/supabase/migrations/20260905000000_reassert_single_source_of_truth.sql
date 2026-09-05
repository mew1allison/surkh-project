-- Correction to the "legacy migrations no-op" assumption in the setup work order.
--
-- The three pre-existing migrations (20260903_allow_public_inventory_read,
-- 20260904_facility_admin_insert, 202609040001_facility_select_grants) are left
-- untouched — migration history is append-only — but they are NOT no-ops after
-- 20260901000000_init_schema: each one re-adds objects the init migration already
-- owns. This file runs last in the push order and restores the invariant that
-- 20260901000000_init_schema.sql is the single source of truth. Nothing is
-- dropped that is not immediately covered by an equivalent policy, so no role
-- loses access.

-- 1. Re-assert the hardened definition. 20260904_facility_admin_insert.sql runs
--    AFTER the init migration and its CREATE OR REPLACE is_admin() has no
--    `set search_path` pin, so it silently overwrote the init version with the
--    mutable-search_path one. Same body, pinned this time.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from "Profile" where id = auth.uid() and role = 'Admin')
$$;

-- 2. Drop the policies the legacy files add on top of the init-schema set. All
--    three are permissive duplicates already covered, for the same roles:
--      Facility  "Allow public read for blood search"  ⊂ facility_read
--      Inventory "Allow public read for blood search"  ⊂ inventory_read
--      Facility  "Admins can create Facilities"        ⊂ facility_admin_insert
--    RLS is permissive-by-default, so removing a duplicate grant-policy can only
--    ever narrow to the surviving policy's scope — which is a superset.
drop policy if exists "Allow public read for blood search" on "Facility";
drop policy if exists "Allow public read for blood search" on "Inventory";
drop policy if exists "Admins can create Facilities" on "Facility";
