-- Migration: Allow public (anonymous) read access for the Find Blood search feature.
-- The Inventory → Facility join requires SELECT on both tables.
-- This is READ-ONLY: no INSERT, UPDATE, or DELETE permissions are granted.

-- 1. Inventory: allow anon role to SELECT all rows
CREATE POLICY IF NOT EXISTS "Allow public read for blood search"
  ON "Inventory"
  FOR SELECT
  TO anon
  USING (true);

-- 2. Facility: allow anon role to SELECT all rows
--    (required for the Inventory → Facility embedded resource join)
CREATE POLICY IF NOT EXISTS "Allow public read for blood search"
  ON "Facility"
  FOR SELECT
  TO anon
  USING (true);
