# Jejak Masjid — Facilities + Photos (Final Spec for Implementation)

This doc captures the finalized decisions from our discussion so Codex can implement them in the existing codebase.

---

## Goals

1. Allow travellers to filter: **“masjid near me that has specific facility”** (e.g. parking, water dispenser, working space).
2. Collect facility info via **structured boolean confirmations** (no free text, no ratings).
3. Collect **general masjid photos** (surroundings / exterior / interior) **not tied to facilities**.
4. Keep moderation minimal and scalable.

---

## Current Schema (Existing)

- `masjid` (with `geohash`, `geohash5`, `lat`, `lng`, etc.)
- `facility` lookup table: `facility(code PK, label)`
- `masjid_facility` join table:
  - `masjid_id` FK → `masjid.id`
  - `facility_code` FK → `facility.code`
  - unique index `(masjid_id, facility_code)`
  - index `(masjid_id)`

This already supports queries like:
- nearby masjids (by geohash5 prefilter) + JOIN `masjid_facility` filtered by `facility_code`.

---

## Final Product Decisions

### 1) Facility data is boolean-only
- Facilities are **confirmed available** or **unknown**.
- MVP does **NOT** support “No / not available” to avoid vandalism and stale negatives.
- No ratings (no cleanliness/ease score), no reviews, no free text.

### 2) Photos are separate from facilities (by default)
- Contributors can upload photos **without tying to any facility**.
- Photos are mainly for: exterior, interior, entrance, surroundings.
- Facility-tagged photos are **optional** (supported by schema design), but facilities should not depend on photos to exist.

---

## Facility Codes to Ship (MVP)

Seed `facility` table with these `code` values and user-facing labels.

### Prayer
- `PRAYER_MALE` — Prayer hall (male)
- `PRAYER_FEMALE` — Prayer hall (female)
- `PRAYER_AC` — Air-conditioned hall
- `WOMEN_FRIENDLY_LAYOUT` — Women-friendly prayer area (wudhu connected/near)

### Wudhu
- `WUDHU_MALE` — Wudhu area (male)
- `WUDHU_FEMALE` — Wudhu area (female)
- `WUDHU_OKU` — Wudhu for OKU

### Toilets
- `TOILET_MALE` — Toilet (male)
- `TOILET_FEMALE` — Toilet (female)
- `TOILET_OKU` — Toilet for OKU

### Accessibility
- `WHEELCHAIR_ACCESS` — Wheelchair access

### Parking
- `PARKING_COMPOUND` — Car parking (masjid compound)
- `PARKING_STREET` — Street parking nearby

### Amenities
- `WATER_DISPENSER` — Water dispenser
- `PHONE_CHARGER` — Phone charging point
- `REST_AREA` — Rest area / seating
- `WORKING_SPACE` — Working space area (table/chair suitable for laptop)

### Other
- `EVENT_SPACE` — Event / multipurpose space

---

## Schema Changes (SQLite / Drizzle)

### A) Improve facility-filter query performance (important)
Add an index to support queries like:
> “nearby masjids with PARKING_COMPOUND”

**Add index on `masjid_facility(facility_code, masjid_id)`**
- This makes `WHERE facility_code = ?` fast and join-friendly.

> Keep existing unique index `(masjid_id, facility_code)`.

---

### B) Add `masjid_photo` table (new)

Purpose:
- Store **general masjid photos** (not tied to facility).
- Optionally allow facility-tagging later (nullable `facilityCode`).

Recommended columns (MVP):
- `id` (PK) — text (uuid/cuid)
- `masjid_id` (FK → masjid.id)
- `user_id` (text) — uploader ID (align with your auth model)
- `url` (text) — required
- `category` (text) — required
  - recommended categories:
    - `EXTERIOR`, `INTERIOR`, `ENTRANCE`, `SURROUNDINGS`, `OTHER`
- `facility_code` (nullable FK → facility.code)
  - normally NULL for general photos
- `status` (text) — default `pending`
  - `pending` | `approved` | `rejected`
- `rejection_reason` (nullable text)
- `created_at` default now

Recommended indexes:
- `(masjid_id)`
- `(masjid_id, status)`
- `(user_id)`
- `(facility_code)` (optional but useful if facility-tagging is used)

Moderation:
- MVP can be light: approve unless flagged; reject obvious issues.

---

## UX / Screens (Implementation Notes)

### 1) Masjid Detail Page
Add two distinct actions:
- **Add Photos**
- **Update Facilities**

Do NOT mix them to avoid confusion:
- Photos = visual context
- Facilities = boolean facts

---

### 2) Update Facilities Screen (boolean checklist)
- Group facilities into sections (Parking, Wudhu, Toilets, Amenities, etc.).
- Each facility is a checkbox: “I confirm this exists”.
- If user is unsure: leave unchecked (unknown).

No free text. No ratings.

---

### 3) Add Photos Screen (general)
- Ask user to choose photo type/category:
  - Exterior / Interior / Entrance / Surroundings / Other
- Upload photo → status pending/approved.
- Photos are not required to be tied to a facility.

Optional future:
- allow users to tag a photo to a facility after upload, but keep it optional.

---

## Queries to Support (Core)

### A) Nearby masjids with a facility
High-level logic:
1. Prefilter nearby by `geohash5 IN (…)` (or your existing nearby approach)
2. Join `masjid_facility` filter by `facility_code`

Example SQL:
```sql
SELECT m.*
FROM masjid m
JOIN masjid_facility mf ON mf.masjid_id = m.id
WHERE m.geohash5 IN (?, ?, ?, ?, ?, ?, ?, ?)
  AND mf.facility_code = 'PARKING_COMPOUND'
  AND m.active = 1;
```

---

## API Endpoints (Facilities + Photos + Contributions)

> Base: same API host as existing routes. Auth required where noted.

### Facilities

#### 1) List facilities (public)
**GET** `/api/facilities`  
**Use**: Fetch facility list to render checkboxes in “Update Facilities” screen.  
**Response**: array of `{ code, label }`.

Example:
```http
GET /api/facilities
```

#### 2) Get a masjid’s confirmed facilities (public)
**GET** `/masjids/:id/facilities`  
**Use**: Show which facilities are confirmed for a masjid.  
**Response**: array of `{ code, label }`.

Example:
```http
GET /masjids/12345/facilities
```

#### 3) Submit facility confirmations (auth)
**POST** `/api/masjids/:id/facilities`  
**Use**: User confirms facilities that exist.  
**Body**:
```json
{
  "facilityCodes": ["PARKING_COMPOUND", "WUDHU_MALE"]
}
```
**Notes**:
- Only valid codes are accepted.
- This endpoint **awards +10 points once per masjid per user** (first submission only).

Example:
```http
POST /api/masjids/12345/facilities
Content-Type: application/json
Authorization: Bearer <token>

{
  "facilityCodes": ["PARKING_COMPOUND", "WUDHU_MALE"]
}
```

---

### Photos

#### 4) List masjid photos (public)
**GET** `/api/masjids/:id/photos`  
**Use**: Display masjid photos on detail page.  
**Query**:
- `status` (optional, default `approved`) — `approved | pending | rejected`
- `limit` (optional, default `50`)
- `category` (optional, comma-separated) — `EXTERIOR,INTERIOR,ENTRANCE,SURROUNDINGS,OTHER`

Example:
```http
GET /api/masjids/12345/photos?status=approved&category=EXTERIOR,ENTRANCE&limit=20
```

#### 5) Get upload URL (auth)
**POST** `/api/masjids/:id/photos/upload-url`  
**Use**: Request a presigned PUT URL for direct upload to R2.  
**Body**:
```json
{
  "category": "EXTERIOR",
  "contentType": "image/jpeg"
}
```
**Response**:
```json
{
  "uploadUrl": "https://<r2-endpoint>/<bucket>/masjid/<id>/<uuid>.jpg?...",
  "publicUrl": "https://bucket.jejakmasjid.my/masjid/<id>/<uuid>.jpg",
  "key": "masjid/<id>/<uuid>.jpg",
  "contentType": "image/jpeg",
  "category": "EXTERIOR"
}
```

Example:
```http
POST /api/masjids/12345/photos/upload-url
Content-Type: application/json
Authorization: Bearer <token>

{
  "category": "EXTERIOR",
  "contentType": "image/jpeg"
}
```

#### 6) Upload photo to R2 (client-side)
**PUT** `<uploadUrl>`  
**Use**: Direct upload from mobile app to R2.  
**Headers**:
- `Content-Type`: must match the `contentType` used above.

Example:
```http
PUT https://<r2-endpoint>/<bucket>/masjid/<id>/<uuid>.jpg?...
Content-Type: image/jpeg

<binary>
```

#### 7) Create photo record (auth)
**POST** `/api/masjids/:id/photos`  
**Use**: Save uploaded photo metadata.  
**Body**:
```json
{
  "key": "masjid/<id>/<uuid>.jpg",
  "category": "EXTERIOR",
  "facilityCode": null
}
```
**Notes**:
- Record is created with `status = pending`.
- **No points are awarded here**.

Example:
```http
POST /api/masjids/12345/photos
Content-Type: application/json
Authorization: Bearer <token>

{
  "key": "masjid/12345/550e8400-e29b-41d4-a716-446655440000.jpg",
  "category": "EXTERIOR"
}
```

#### 8) Approve photo (auth, admin-only in app)
**POST** `/api/admin/masjid-photos/:id/approve`  
**Use**: Approve photo and award points.  
**Notes**:
- Awards **+10 points once per masjid per user** upon approval.
- Backend currently only checks auth, not admin role.

Example:
```http
POST /api/admin/masjid-photos/abc123/approve
Authorization: Bearer <token>
```

---

### Nearby Filter

#### 9) Nearby masjids with facility filter (public)
**GET** `/masjids/nearby?lat=...&lng=...&radius=...&facility_code=...`  
**Use**: “Masjid near me with specific facility.”  
**Query**:
- `lat` (required)
- `lng` (required)
- `radius` (optional, max 5km, default 5)
- `facility_code` (optional)

Example:
```http
GET /masjids/nearby?lat=3.139&lng=101.6869&radius=5&facility_code=PARKING_COMPOUND
```
