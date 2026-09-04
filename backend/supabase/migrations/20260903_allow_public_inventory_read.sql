-- Migration: Allow public (anonymous) read access for the Find Blood search feature.
-- The Inventory → Facility join requires SELECT on both tables.
-- This is READ-ONLY: no INSERT, UPDATE, or DELETE permissions are granted.

-- 1. Inventory: allow anon role to SELECT all rows
--    Wrapped in DO for idempotency — PostgreSQL's CREATE POLICY does not
--    support IF NOT EXISTS natively, so the existence check is done against
--    pg_policies (the system catalog for all RLS policies).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'Inventory'
      AND policyname = 'Allow public read for blood search'
  ) THEN
    CREATE POLICY "Allow public read for blood search"
      ON "Inventory"
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- 2. Facility: allow anon role to SELECT all rows
--    (required for the Inventory → Facility embedded resource join)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'Facility'
      AND policyname = 'Allow public read for blood search'
  ) THEN
    CREATE POLICY "Allow public read for blood search"
      ON "Facility"
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
