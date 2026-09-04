-- Migration: Grant table-level SELECT on "Facility" to authenticated and anon.
--
-- Root cause: the "Facility" table was created without explicit SELECT grants
-- for either role. This caused:
--   1. POST /api/facilities — .insert().select().single() fails with SQLSTATE
--      42501 because authenticated cannot SELECT the newly inserted row back.
--   2. Public blood search — the Inventory → Facility embedded join requires
--      anon SELECT on Facility; the RLS policy already permits it, but the
--      table-level grant was missing.
--
-- These GRANTs do NOT weaken any existing RLS policies — the policies on
-- "Facility" remain the row-level authorization mechanism. The grants simply
-- enable the table-level permission the policies depend on.

GRANT SELECT ON "Facility" TO authenticated;
GRANT SELECT ON "Facility" TO anon;
