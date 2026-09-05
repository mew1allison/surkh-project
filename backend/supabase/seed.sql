-- Seed data, applied by `supabase db reset` (npm run db:reset -- --linked) AFTER every file
-- in supabase/migrations/, and never by plain `db push`.
--
-- Identifiers are double-quoted on purpose: the schema is created as "Facility",
-- "Inventory" and "Profile" (quoted mixed case, see 20260901000000_init_schema.sql). An
-- unquoted name is folded to lowercase by Postgres and fails as a missing relation.

-- 20260901000000_init_schema.sql inserts three demo facilities of its own, which take ids
-- 1-3 in a freshly migrated database -- the same ids this file uses for other hospitals.
-- Clear them and their stock first so the inserts below cannot clash on the primary key.
DELETE FROM "Inventory" WHERE facility_id IN (
  SELECT id FROM "Facility" WHERE facility_code IN ('KHI-001', 'LHR-001', 'PES-001'));
DELETE FROM "Facility" WHERE facility_code IN ('KHI-001', 'LHR-001', 'PES-001');

-- SQL Data Seeding for table: Facility
-- OVERRIDING SYSTEM VALUE is required because id is `generated always as identity`.
INSERT INTO "Facility" (id, created_at, name, location, latitude, longitude, has_emr, facility_code, city) OVERRIDING SYSTEM VALUE VALUES
(1, '2026-08-21 12:00:00+00', 'Pakistan Institute of Medical Sciences (PIMS)', 'G-8/3, Islamabad', 33.6844, 73.047, true, 'FAC-001', 'Islamabad'),
(2, '2026-08-20 12:00:00+00', 'Shifa International Hospital', 'H-8/4, Islamabad', 33.6851, 73.0573, true, 'FAC-002', 'Islamabad'),
(3, '2026-08-19 12:00:00+00', 'Quaid-e-Azam International Hospital', 'H-13, Islamabad', 33.6489, 73.0167, true, 'FAC-003', 'Islamabad'),
(4, '2026-08-18 12:00:00+00', 'Maroof International Hospital', 'F-10, Islamabad', 33.6996, 73.0136, true, 'FAC-004', 'Islamabad'),
(5, '2026-08-17 12:00:00+00', 'Capital Hospital (CDA Hospital)', 'G-6/3, Islamabad', 33.7166, 73.0765, true, 'FAC-005', 'Islamabad'),
(6, '2026-08-16 12:00:00+00', 'Holy Family Hospital', 'Satellite Town, Rawalpindi', 33.6303, 73.07, true, 'FAC-006', 'Rawalpindi'),
(7, '2026-08-15 12:00:00+00', 'Benazir Bhutto Hospital', 'Main Murree Road, Rawalpindi', 33.6067, 73.0547, false, 'FAC-007', 'Rawalpindi'),
(8, '2026-08-14 12:00:00+00', 'Combined Military Hospital Rawalpindi', 'Tamiz Ud Din Road, Rawalpindi', 33.5969, 73.052, true, 'FAC-008', 'Rawalpindi'),
(9, '2026-08-13 12:00:00+00', 'Fauji Foundation Hospital Rawalpindi', 'Jhelum Road, Rawalpindi', 33.5925, 73.04, false, 'FAC-009', 'Rawalpindi'),
(10, '2026-08-12 12:00:00+00', 'Mayo Hospital', 'Hospital Road, Lahore', 31.5804, 74.3087, true, 'FAC-010', 'Lahore'),
(11, '2026-08-11 12:00:00+00', 'Services Hospital Lahore', 'Main Jail Road, Lahore', 31.5365, 74.3294, true, 'FAC-011', 'LAhore'),
(12, '2026-08-10 12:00:00+00', 'Jinnah Hospital Lahore', 'Faisal Town, Lahore', 31.484, 74.302, true, 'FAC-012', 'Lahore'),
(13, '2026-08-09 12:00:00+00', 'Shaukat Khanum Memorial Cancer Hospital', 'Johar Town, Lahore', 31.4697, 74.2728, true, 'FAC-013', 'Lahore'),
(14, '2026-08-08 12:00:00+00', 'Pakistan Kidney and Liver Institute and Research Centre (PKLI)', 'DHA Phase VI, Lahore', 31.467, 74.401, true, 'FAC-014', 'Lahore'),
(15, '2026-08-07 12:00:00+00', 'Lahore General Hospital', 'Ferozepur Road, Lahore', 31.492, 74.327, false, 'FAC-015', 'Lahore'),
(16, '2026-08-06 12:00:00+00', 'Punjab Institute of Cardiology', 'Ghous-ul-Azam Road, Lahore', 31.542, 74.329, true, 'FAC-016', 'Lahore'),
(17, '2026-08-05 12:00:00+00', 'Allied Hospital Faisalabad', 'Jail Road, Faisalabad', 31.4229, 73.0891, false, 'FAC-017', 'Faisalabad'),
(18, '2026-08-04 12:00:00+00', 'Nishtar Hospital', 'Nishtar Road, Hamid Colony, Multan', 30.1984, 71.4687, true, 'FAC-018', 'Multan'),
(19, '2026-08-03 12:00:00+00', 'Jinnah Postgraduate Medical Centre (JPMC)', 'Cantonment Area, Karachi', 24.855, 67.007, true, 'FAC-019', 'Karachi'),
(20, '2026-08-02 12:00:00+00', 'Dr. Ruth K. M. Pfau Civil Hospital Karachi', 'Mission Road, Karachi', 24.855, 67.007, false, 'FAC-020', 'Karachi'),
(21, '2026-08-01 12:00:00+00', 'Indus Hospital & Health Network - Korangi Campus', 'Korangi, Karachi', 24.8415, 67.112, true, 'FAC-021', 'Karachi'),
(22, '2026-07-31 12:00:00+00', 'Aga Khan University Hospital', 'Stadium Road, Karachi', 24.8949, 67.0746, true, 'FAC-022', 'Karachi'),
(23, '2026-07-30 12:00:00+00', 'National Institute of Cardiovascular Diseases (NICVD)', 'Rafiqui Shaheed Road, Karachi', 24.8734, 67.03, true, 'FAC-023', 'Karachi'),
(24, '2026-07-29 12:00:00+00', 'Liaquat National Hospital', 'National Stadium Road, Karachi', 24.894, 67.083, true, 'FAC-024', 'Karachi'),
(25, '2026-07-28 12:00:00+00', 'Hayatabad Medical Complex', 'Phase 4, Hayatabad Suburb, Peshawar', 33.9956, 71.4261, true, 'FAC-025', 'Peshawar'),
(26, '2026-07-27 12:00:00+00', 'Lady Reading Hospital', 'Hospital Road, Peshawar', 34.0075, 71.56, true, 'FAC-026', 'Peshawar'),
(27, '2026-07-26 12:00:00+00', 'Rehman Medical Institute', 'Phase 5, Hayatabad, Peshawar', 33.995, 71.434, false, 'FAC-027', 'Peshawar'),
(28, '2026-07-25 12:00:00+00', 'Bolan Medical Complex Hospital', 'Brewery Road, Quetta', 30.1874, 67.0014, false, 'FAC-028', 'Quetta'),
(29, '2026-07-24 12:00:00+00', 'Bahawal Victoria Hospital', 'Circular Road, Bahawalpur', 29.3956, 71.6836, false, 'FAC-029', 'Bahawalpur'),
(30, '2026-07-23 12:00:00+00', 'Chandka Medical College Hospital', 'Shah Nawaz Bhutto Road, Larkana', 27.558, 68.212, false, 'FAC-030', 'Larkana')
ON CONFLICT DO NOTHING;

-- SQL Data Seeding for table: Inventory
INSERT INTO "Inventory" (id, created_at, blood_group, quantity, expiry_date, status, updated_at, facility_id) OVERRIDING SYSTEM VALUE VALUES
(33, '2026-07-17 12:00:00+00', 'O-', 1, '2027-08-26', 'low', '2026-07-22 12:00:00', 9),
(10, '2026-07-12 12:00:00+00', 'B+', 34, '2027-01-27', 'available', '2026-07-12 12:00:00', 3),
(18, '2026-07-27 12:00:00+00', 'AB+', 33, '2027-01-04', 'available', '2026-07-31 12:00:00', 5),
(26, '2026-07-10 12:00:00+00', 'O+', 27, '2027-05-13', 'available', '2026-07-12 12:00:00', 7),
(30, '2026-07-01 12:00:00+00', 'O-', 31, '2027-04-06', 'available', '2026-07-05 12:00:00', 8),
(42, '2026-07-13 12:00:00+00', 'B+', 9, '2027-05-13', 'available', '2026-07-13 12:00:00', 11),
(6, '2026-08-03 12:00:00+00', 'A-', 17, '2027-09-04', 'available', '2026-08-03 12:00:00', 2),
(50, '2026-07-19 12:00:00+00', 'AB+', 11, '2027-02-22', 'available', '2026-07-20 12:00:00', 13),
(54, '2026-07-09 12:00:00+00', 'AB-', 22, '2027-03-23', 'available', '2026-07-11 12:00:00', 14),
(58, '2026-07-13 12:00:00+00', 'O+', 29, '2027-03-31', 'available', '2026-07-15 12:00:00', 15),
(66, '2026-07-28 12:00:00+00', 'A+', 13, '2027-03-29', 'available', '2026-07-30 12:00:00', 17),
(2, '2026-06-26 12:00:00+00', 'A+', 9, '2027-05-02', 'low', '2026-06-27 12:00:00', 1),
(74, '2026-08-16 12:00:00+00', 'B+', 2, '2027-03-01', 'available', '2026-08-19 12:00:00', 19),
(78, '2026-07-16 12:00:00+00', 'B-', 15, '2027-05-27', 'available', '2026-07-18 12:00:00', 20),
(14, '2026-07-23 12:00:00+00', 'B-', 25, '2027-10-05', 'available', '2026-07-26 12:00:00', 4),
(9, '2026-07-01 12:00:00+00', 'A-', 24, '2027-08-05', 'available', '2026-07-04 12:00:00', 3),
(22, '2026-06-26 12:00:00+00', 'AB-', 35, '2027-09-16', 'available', '2026-07-01 12:00:00', 6),
(13, '2026-08-20 12:00:00+00', 'B+', 21, '2027-09-20', 'available', '2026-08-25 12:00:00', 4),
(17, '2026-07-01 12:00:00+00', 'B-', 34, '2027-08-09', 'available', '2026-07-05 12:00:00', 5),
(34, '2026-08-01 12:00:00+00', 'A+', 20, '2027-10-18', 'available', '2026-08-04 12:00:00', 9),
(38, '2026-07-29 12:00:00+00', 'A-', 33, '2027-11-30', 'available', '2026-07-29 12:00:00', 10),
(21, '2026-06-30 12:00:00+00', 'AB+', 10, '2027-08-01', 'available', '2026-06-30 12:00:00', 6),
(46, '2026-07-22 12:00:00+00', 'B-', 16, '2027-10-26', 'available', '2026-07-26 12:00:00', 12),
(25, '2026-07-07 12:00:00+00', 'AB-', 32, '2027-08-05', 'available', '2026-07-11 12:00:00', 7),
(29, '2026-08-19 12:00:00+00', 'O+', 2, '2027-09-20', 'available', '2026-08-20 12:00:00', 8),
(62, '2026-07-24 12:00:00+00', 'O-', 5, '2027-11-27', 'available', '2026-07-29 12:00:00', 16),
(70, '2026-08-03 12:00:00+00', 'A-', 28, '2027-11-29', 'available', '2026-08-06 12:00:00', 18),
(77, '2026-08-14 12:00:00+00', 'B+', 15, '2026-08-17', 'expired', '2026-08-18 12:00:00', 20),
(37, '2026-08-17 12:00:00+00', 'A+', 32, '2027-09-16', 'available', '2026-08-22 12:00:00', 10),
(41, '2026-07-13 12:00:00+00', 'A-', 7, '2027-08-07', 'available', '2026-07-14 12:00:00', 11),
(45, '2026-07-08 12:00:00+00', 'B+', 33, '2027-08-05', 'available', '2026-07-13 12:00:00', 12),
(49, '2026-07-20 12:00:00+00', 'B-', 21, '2027-08-19', 'available', '2026-07-23 12:00:00', 13),
(1, '2026-08-01 12:00:00+00', 'O-', 9, '2027-09-02', 'available', '2026-08-05 12:00:00', 1),
(53, '2026-08-20 12:00:00+00', 'AB+', 3, '2027-09-21', 'available', '2026-08-24 12:00:00', 14),
(57, '2026-07-15 12:00:00+00', 'AB-', 11, '2027-08-12', 'available', '2026-07-19 12:00:00', 15),
(61, '2026-07-11 12:00:00+00', 'O+', 4, '2027-08-19', 'available', '2026-07-15 12:00:00', 16),
(65, '2026-06-25 12:00:00+00', 'O-', 35, '2027-07-19', 'available', '2026-06-26 12:00:00', 17),
(69, '2026-07-23 12:00:00+00', 'A+', 18, '2027-08-28', 'available', '2026-07-26 12:00:00', 18),
(73, '2026-06-28 12:00:00+00', 'A-', 8, '2027-07-23', 'available', '2026-06-29 12:00:00', 19),
(81, '2026-08-11 12:00:00+00', 'B-', 29, '2027-09-11', 'available', '2026-08-11 12:00:00', 21),
(3, '2026-07-02 12:00:00+00', 'A-', 28, '2027-07-12', 'available', '2026-07-06 12:00:00', 1),
(86, '2026-06-27 12:00:00+00', 'AB-', 28, '2027-02-21', 'available', '2026-06-29 12:00:00', 22),
(94, '2026-08-18 12:00:00+00', 'O-', 24, '2027-04-28', 'available', '2026-08-23 12:00:00', 24),
(102, '2026-08-20 12:00:00+00', 'A-', 21, '2027-07-10', 'available', '2026-08-23 12:00:00', 26),
(110, '2026-07-17 12:00:00+00', 'B-', 13, '2027-05-01', 'available', '2026-07-17 12:00:00', 28),
(114, '2026-06-27 12:00:00+00', 'AB+', 34, '2027-02-12', 'available', '2026-06-28 12:00:00', 29),
(118, '2026-06-25 12:00:00+00', 'AB-', 32, '2027-05-18', 'available', '2026-06-30 12:00:00', 30),
(82, '2026-07-04 12:00:00+00', 'AB+', 5, '2027-11-02', 'available', '2026-07-06 12:00:00', 21),
(85, '2026-08-05 12:00:00+00', 'AB+', 18, '2027-08-26', 'available', '2026-08-05 12:00:00', 22),
(90, '2026-06-23 12:00:00+00', 'O+', 4, '2027-12-29', 'available', '2026-06-26 12:00:00', 23),
(89, '2026-07-03 12:00:00+00', 'AB-', 22, '2027-08-05', 'available', '2026-07-06 12:00:00', 23),
(98, '2026-07-18 12:00:00+00', 'A+', 3, '2027-11-23', 'available', '2026-07-20 12:00:00', 25),
(93, '2026-07-28 12:00:00+00', 'O+', 18, '2027-09-02', 'available', '2026-07-30 12:00:00', 24),
(106, '2026-06-26 12:00:00+00', 'B+', 27, '2027-10-06', 'available', '2026-06-28 12:00:00', 27),
(97, '2026-08-01 12:00:00+00', 'O-', 28, '2027-09-09', 'available', '2026-08-05 12:00:00', 25),
(101, '2026-07-30 12:00:00+00', 'A+', 35, '2027-09-03', 'available', '2026-08-03 12:00:00', 26),
(105, '2026-08-10 12:00:00+00', 'A-', 10, '2027-09-04', 'available', '2026-08-14 12:00:00', 27),
(109, '2026-07-12 12:00:00+00', 'B+', 10, '2027-08-07', 'available', '2026-07-16 12:00:00', 28),
(113, '2026-07-22 12:00:00+00', 'B-', 17, '2027-08-15', 'available', '2026-07-22 12:00:00', 29),
(117, '2026-07-23 12:00:00+00', 'AB+', 24, '2027-08-25', 'available', '2026-07-28 12:00:00', 30),
(11, '2026-07-17 12:00:00+00', 'B-', 7, '2027-07-25', 'available', '2026-07-21 12:00:00', 3),
(15, '2026-06-25 12:00:00+00', 'AB+', 27, '2027-07-05', 'available', '2026-06-29 12:00:00', 4),
(19, '2026-07-16 12:00:00+00', 'AB-', 28, '2027-07-25', 'available', '2026-07-19 12:00:00', 5),
(23, '2026-07-22 12:00:00+00', 'O+', 29, '2027-07-28', 'available', '2026-07-23 12:00:00', 6),
(27, '2026-07-08 12:00:00+00', 'O-', 34, '2027-07-16', 'available', '2026-07-11 12:00:00', 7),
(31, '2026-06-24 12:00:00+00', 'A+', 25, '2027-06-29', 'available', '2026-06-25 12:00:00', 8),
(35, '2026-07-08 12:00:00+00', 'A-', 30, '2027-07-19', 'available', '2026-07-13 12:00:00', 9),
(39, '2026-08-12 12:00:00+00', 'B+', 28, '2027-08-17', 'available', '2026-08-15 12:00:00', 10),
(43, '2026-07-10 12:00:00+00', 'B-', 19, '2027-07-19', 'available', '2026-07-15 12:00:00', 11),
(47, '2026-08-03 12:00:00+00', 'AB+', 34, '2027-08-08', 'available', '2026-08-03 12:00:00', 12),
(51, '2026-08-15 12:00:00+00', 'AB-', 2, '2027-08-20', 'available', '2026-08-18 12:00:00', 13),
(55, '2026-06-24 12:00:00+00', 'O+', 22, '2027-06-29', 'available', '2026-06-24 12:00:00', 14),
(56, '2026-07-16 12:00:00+00', 'O-', 31, '2027-11-09', 'available', '2026-07-20 12:00:00', 14),
(59, '2026-07-09 12:00:00+00', 'O-', 16, '2027-07-16', 'available', '2026-07-14 12:00:00', 15),
(60, '2026-08-19 12:00:00+00', 'A+', 27, '2027-12-11', 'available', '2026-08-20 12:00:00', 15),
(63, '2026-07-07 12:00:00+00', 'A+', 32, '2027-07-14', 'available', '2026-07-12 12:00:00', 16),
(64, '2026-07-11 12:00:00+00', 'A-', 10, '2027-11-28', 'available', '2026-07-15 12:00:00', 16),
(67, '2026-06-27 12:00:00+00', 'A-', 28, '2027-07-02', 'available', '2026-06-27 12:00:00', 17),
(68, '2026-08-10 12:00:00+00', 'B+', 21, '2027-12-04', 'available', '2026-08-12 12:00:00', 17),
(71, '2026-07-19 12:00:00+00', 'B+', 22, '2027-07-27', 'available', '2026-07-22 12:00:00', 18),
(75, '2026-07-18 12:00:00+00', 'B-', 28, '2027-07-26', 'available', '2026-07-23 12:00:00', 19),
(79, '2026-07-10 12:00:00+00', 'AB+', 19, '2027-07-17', 'available', '2026-07-14 12:00:00', 20),
(80, '2026-07-02 12:00:00+00', 'AB-', 8, '2027-09-16', 'available', '2026-07-04 12:00:00', 20),
(83, '2026-07-20 12:00:00+00', 'AB-', 8, '2027-07-26', 'available', '2026-07-22 12:00:00', 21),
(5, '2026-08-21 12:00:00+00', 'A+', 20, '2027-09-16', 'available', '2026-08-25 12:00:00', 2),
(8, '2026-07-27 12:00:00+00', 'B-', 17, '2027-09-04', 'available', '2026-07-29 12:00:00', 2),
(381, '2026-09-03 21:55:54.340302+00', 'O+', 1, '2027-09-04', 'low', '2026-09-03 21:55:54.340302', 2),
(382, '2026-09-03 21:56:06.861627+00', 'O-', 2, '2027-09-04', 'low', '2026-09-03 21:56:06.861627', 2),
(7, '2026-06-30 12:00:00+00', 'B+', 12, '2027-09-04', 'available', '2026-07-05 12:00:00', 2),
(4, '2026-07-04 12:00:00+00', 'B+', 33, '2027-03-15', 'available', '2026-07-08 12:00:00', 1),
(12, '2026-07-23 12:00:00+00', 'AB+', 20, '2027-06-09', 'available', '2026-07-24 12:00:00', 3),
(16, '2026-06-27 12:00:00+00', 'AB-', 33, '2027-02-24', 'available', '2026-06-27 12:00:00', 4),
(20, '2026-07-01 12:00:00+00', 'O+', 35, '2026-08-18', 'expired', '2026-07-01 12:00:00', 5),
(24, '2026-06-28 12:00:00+00', 'O-', 16, '2027-03-13', 'available', '2026-06-28 12:00:00', 6),
(28, '2026-08-09 12:00:00+00', 'A+', 29, '2027-01-20', 'available', '2026-08-11 12:00:00', 7),
(32, '2026-07-23 12:00:00+00', 'A-', 33, '2027-05-02', 'available', '2026-07-27 12:00:00', 8),
(36, '2026-07-24 12:00:00+00', 'B+', 18, '2027-03-24', 'available', '2026-07-25 12:00:00', 9),
(40, '2026-08-21 12:00:00+00', 'B-', 7, '2027-07-12', 'available', '2026-08-24 12:00:00', 10),
(44, '2026-08-21 12:00:00+00', 'AB+', 11, '2027-07-12', 'available', '2026-08-23 12:00:00', 11),
(48, '2026-06-23 12:00:00+00', 'AB-', 12, '2027-05-15', 'available', '2026-06-24 12:00:00', 12)
ON CONFLICT DO NOTHING;

-- The ids above were supplied explicitly, so both identity sequences are still sitting at 1.
-- Restart them past the seeded rows, or the next facility/inventory row the API creates
-- collides on the primary key.
SELECT setval(pg_get_serial_sequence('public."Facility"',  'id'), COALESCE(MAX(id), 1)) FROM "Facility";
SELECT setval(pg_get_serial_sequence('public."Inventory"', 'id'), COALESCE(MAX(id), 1)) FROM "Inventory";

-- No "Profile" rows are seeded. "Profile".id is a foreign key to auth.users(id) (see
-- 20260901000000_init_schema.sql) and the auth schema is not part of what a reset restores,
-- so the five accounts exported from the old shared project can never resolve in a fresh
-- one. Profiles are created by POST /api/auth/signup, which makes the Auth user and then
-- the row -- sign up against any seeded facility_code (FAC-001 .. FAC-030) for a login.
