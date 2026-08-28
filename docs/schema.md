Facility
- id            (int8)
- name          (text)
- location      (text)
- latitude      (numeric)
- longitude     (numeric)
- has_emr       (boolean)
- created_at    (timestampz)

Inventory 
- id (int8)
- created_at (timestampz)
- blood_group (text)
- quantity (int4)
- expiry_date (date)
- status (text)
- component_type (text)
- updated_at (timestamp)
- facility_id (foreign key)

Profile
- id (uuid)
- created_at (timestampz)
- full_name (text)
- email (text)
- role (text)
- facility_id (foreign key)

Exchange Request
- id (int8)
- created_at (timestampz)
- requester_facility_id (int8)
- provider_facility_id (int8)
- blood_group (text)
- quantity (int4)
- status (text)
- requested_by (uuid)