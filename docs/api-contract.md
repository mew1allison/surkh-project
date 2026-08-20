# Surkh — API Contract

All endpoints return JSON. Field names must match `docs/schema.md` exactly.

---

## GET /facilities
Returns all facilities.

**Response**
```json
[
  { "id": "uuid", "name": "Holy Family Hospital", "location": "Rawalpindi",
    "latitude": 33.6007, "longitude": 73.0679, "has_emr": false }
]
```

---

## GET /inventory
Two use cases, same endpoint, different query param.

**Public search** — `GET /inventory?blood_group=O+`
Returns matching inventory rows across all facilities, joined with facility name/location.

**Hospital dashboard** — `GET /inventory?facility_id=uuid`
Returns only that facility's inventory rows.

**Response**
```json
[
  { "facility_id": "uuid", "blood_group": "O+", "unit_count": 12, "last_updated": "2026-08-20T09:00:00Z" }
]
```

---

## POST /ledger-extract
Sends a photographed capture slip for AI extraction. Backend-only call to Gemini — frontend never calls Gemini directly.

**Request**
```json
{ "image": "base64-or-file" }
```

**Response**
```json
{ "blood_group": "O+", "quantity": 3, "date": "2026-08-20", "confidence": { "blood_group": "high", "quantity": "high", "date": "low" } }
```

---

## POST /inventory/confirm
Writes a confirmed entry (from ledger confirm screen or manual entry) into `inventory`.

**Request**
```json
{ "facility_id": "uuid", "blood_group": "O+", "quantity": 3, "date": "2026-08-20" }
```

**Response**
```json
{ "success": true }
```
