-- Migration: Allow admin users to create new Facilities via POST /api/facilities.
-- The facilities route handler authenticates the Bearer token and maps SQLSTATE
-- 42501 to HTTP 403, so this policy is the sole authorization gate.

-- 1. is_admin() — SECURITY DEFINER so the function can read "Profile"
--    regardless of the caller's RLS policies on that table.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Profile"
    WHERE id = auth.uid()
      AND role = 'Admin'
  );
$$;

-- 2. INSERT policy — only authenticated users whose Profile.role = 'Admin'
--    may add rows to "Facility". No UPDATE/DELETE is granted here; those
--    remain blocked until explicit policies are added in a later migration.
--    Wrapped in DO for idempotency — PostgreSQL's CREATE POLICY does not
--    support IF NOT EXISTS natively.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'Facility'
      AND policyname = 'Admins can create Facilities'
  ) THEN
    CREATE POLICY "Admins can create Facilities"
      ON "Facility"
      FOR INSERT
      TO authenticated
      WITH CHECK (is_admin());
  END IF;
END $$;
