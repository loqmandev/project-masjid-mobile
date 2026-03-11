# Backend Implementation Guide: Limited Events & Badges

## Overview

This document provides complete context for implementing the **Limited Events and Badges** feature on the backend server. The frontend mobile app (Expo/React Native) has already implemented the UI components and expects specific API responses.

---

## Table of Contents

1. [Architecture Context](#architecture-context)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Core Business Logic](#core-business-logic)
5. [Integration Points](#integration-points)
6. [Scheduled Jobs](#scheduled-jobs)
7. [Example Seed Data](#example-seed-data)

---

## Architecture Context

### Tech Stack
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth (Google OAuth, Apple Sign In)
- **API**: REST endpoints (Express or Hono)
- **Mobile App**: Expo React Native (already implemented)

### Existing Tables
The backend already has these tables:
- `user` - Better Auth user table
- `user_profile` - Gamification profile (points, ranks, streaks)
- `check_in` - Check-in/check-out records
- `achievement_definition` - Achievement templates
- `user_achievement` - User achievement progress

### API Base URL
- Production: `https://tunnel.jejakmasjid.my`
- All endpoints are prefixed with `/api/` for authenticated routes

---

## Database Schema

### New Tables to Create

#### 1. `limited_event` Table

```sql
CREATE TABLE limited_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) NOT NULL UNIQUE,           -- e.g., "ramadan-2025"
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  banner_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'upcoming',  -- upcoming, active, completed, cancelled
  start_date_time TIMESTAMPTZ NOT NULL,
  end_date_time TIMESTAMPTZ NOT NULL,
  missions JSONB NOT NULL,                     -- Array of mission objects
  badge JSONB NOT NULL,                        -- Embedded badge object
  bonus_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_limited_event_status ON limited_event(status);
CREATE INDEX idx_limited_event_start_date ON limited_event(start_date_time);
CREATE INDEX idx_limited_event_end_date ON limited_event(end_date_time);
```

**JSONB Structure for `missions`:**
```json
[
  {
    "id": "mission_1",
    "type": "unique_masjids",
    "targetCount": 10,
    "description": "Visit 10 unique masjids",
    "masjidIds": null,
    "prayerNames": null
  },
  {
    "id": "mission_2",
    "type": "prayer_times",
    "targetCount": 5,
    "description": "Check in during 5 different prayer times",
    "masjidIds": null,
    "prayerNames": ["fajr", "dhuhr", "asr", "maghrib", "isha"]
  }
]
```

**Mission Types:**
| Type | Description | Tracks |
|------|-------------|--------|
| `unique_masjids` | Visit N unique masjids | masjidIdsVisited[] |
| `checkin_count` | Complete N total check-ins | counter |
| `prayer_streak` | Maintain N day streak | datesVisited[] |
| `specific_masjids` | Visit specific masjid IDs | masjidIdsVisited[] |
| `district_coverage` | Visit N different districts | districtsVisited[] |
| `prayer_times` | Check in during N prayer times | prayerNamesCompleted[] |

**JSONB Structure for `badge`:**
```json
{
  "id": "badge_ramadan_2025",
  "eventId": "evt_123",
  "name": "Ramadan Explorer",
  "description": "Completed the Ramadan Challenge",
  "iconUrl": "https://example.com/badge.png",
  "rarity": "epic"
}
```

**Badge Rarity Levels:**
- `common` - Basic badge
- `rare` - Uncommon badge
- `epic` - Rare badge
- `legendary` - Very rare badge

---

#### 2. `user_event_participation` Table

```sql
CREATE TABLE user_event_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES limited_event(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  badge_earned BOOLEAN NOT NULL DEFAULT FALSE,
  badge_earned_at TIMESTAMPTZ,
  mission_progress JSONB NOT NULL,             -- Array of progress objects
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_event UNIQUE (user_profile_id, event_id)
);

CREATE INDEX idx_user_event_participation_user ON user_event_participation(user_profile_id);
CREATE INDEX idx_user_event_participation_event ON user_event_participation(event_id);
CREATE INDEX idx_user_event_participation_completed ON user_event_participation(is_completed);
```

**JSONB Structure for `mission_progress`:**
```json
[
  {
    "missionId": "mission_1",
    "currentProgress": 5,
    "targetCount": 10,
    "isCompleted": false,
    "masjidIdsVisited": ["masjid_1", "masjid_2", ...],
    "districtsVisited": null,
    "prayerNamesCompleted": null
  },
  {
    "missionId": "mission_2",
    "currentProgress": 3,
    "targetCount": 5,
    "isCompleted": false,
    "masjidIdsVisited": null,
    "districtsVisited": null,
    "prayerNamesCompleted": ["fajr", "dhuhr", "asr"]
  }
]
```

---

#### 3. `user_limited_badge` Table

```sql
CREATE TABLE user_limited_badge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES limited_event(id) ON DELETE CASCADE,
  badge_id VARCHAR(255) NOT NULL,              -- References badge.id from event's badge JSON
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  featured_order INTEGER,                      -- 0-4 for featured position (max 5 badges)
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_badge UNIQUE (user_profile_id, badge_id)
);

CREATE INDEX idx_user_limited_badge_user ON user_limited_badge(user_profile_id);
CREATE INDEX idx_user_limited_badge_featured ON user_limited_badge(is_featured);
CREATE INDEX idx_user_limited_badge_featured_order ON user_limited_badge(featured_order);
```

---

## API Endpoints

### Response Format Reference

The frontend expects these exact response structures defined in `/types/limited-event.ts`:

```typescript
// Frontend type definitions (DO NOT MODIFY)
interface LimitedEvent {
  id: string;
  code: string;
  name: string;
  description: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  startDateTime: string;  // ISO datetime
  endDateTime: string;    // ISO datetime
  missions: EventMission[];
  badge: LimitedBadge;
  bonusPoints: number;
  createdAt: string;
  updatedAt: string;
}

interface UserEventParticipation {
  id: string;
  eventId: string;
  event: LimitedEvent;
  missionProgress: UserMissionProgress[];
  isCompleted: boolean;
  badgeEarned: boolean;
  badgeEarnedAt: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserLimitedBadge {
  id: string;
  badgeId: string;
  badge: LimitedBadge;
  eventId: string;
  event: LimitedEvent;
  earnedAt: string;
  isFeatured: boolean;
  featuredOrder: number | null;
}
```

---

### 1. GET `/api/limited-events`

**Description:** Fetch all currently active limited events

**Auth:** Public (no authentication required)

**Response:** `200 OK`
```json
[
  {
    "id": "evt_abc123",
    "code": "ramadan-2025",
    "name": "Ramadan Challenge 2025",
    "description": "Visit 10 unique masjids during Ramadan",
    "imageUrl": "https://example.com/event.png",
    "bannerUrl": "https://example.com/banner.png",
    "status": "active",
    "startDateTime": "2025-03-01T00:00:00Z",
    "endDateTime": "2025-03-31T23:59:59Z",
    "missions": [
      {
        "id": "mission_1",
        "type": "unique_masjids",
        "targetCount": 10,
        "description": "Visit 10 unique masjids"
      }
    ],
    "badge": {
      "id": "badge_ramadan_2025",
      "eventId": "evt_abc123",
      "name": "Ramadan Explorer",
      "description": "Completed Ramadan Challenge",
      "iconUrl": "https://example.com/badge.png",
      "rarity": "epic",
      "earnedCount": 42
    },
    "bonusPoints": 500,
    "createdAt": "2025-02-15T00:00:00Z",
    "updatedAt": "2025-02-15T00:00:00Z"
  }
]
```

**Logic:**
1. Query events where `status = 'active'`
2. Filter to events where `startDateTime <= NOW() <= endDateTime`
3. For each event, count badges earned: `SELECT COUNT(*) FROM user_limited_badge WHERE badge_id = event.badge.id`
4. Return sorted by `startDateTime` ascending

---

### 2. GET `/api/limited-events/:eventId`

**Description:** Fetch a specific limited event by ID

**Auth:** Public

**Response:** `200 OK` - Single event object (same structure as above)

**Error:** `404 Not Found` if event doesn't exist

---

### 3. GET `/api/user/limited-events`

**Description:** Fetch user's event participations with progress

**Auth:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "part_123",
    "eventId": "evt_abc123",
    "event": { /* LimitedEvent object */ },
    "missionProgress": [
      {
        "missionId": "mission_1",
        "currentProgress": 5,
        "targetCount": 10,
        "isCompleted": false,
        "masjidIdsVisited": ["masjid_1", "masjid_2", "masjid_3", "masjid_4", "masjid_5"]
      }
    ],
    "isCompleted": false,
    "badgeEarned": false,
    "badgeEarnedAt": null,
    "startedAt": "2025-03-05T10:00:00Z",
    "completedAt": null,
    "createdAt": "2025-03-05T10:00:00Z",
    "updatedAt": "2025-03-05T15:30:00Z"
  }
]
```

**Logic:**
1. Get user profile from auth session
2. Query `user_event_participation` where `user_profile_id = profile.id`
3. Join with `limited_event` to get event details
4. Include badge earned counts
5. Return sorted by `createdAt` descending

---

### 4. GET `/api/user/limited-badges`

**Description:** Fetch user's earned limited badges

**Auth:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "ub_xyz789",
    "badgeId": "badge_ramadan_2024",
    "badge": {
      "id": "badge_ramadan_2024",
      "eventId": "evt_old",
      "name": "Ramadan Explorer 2024",
      "description": "Completed Ramadan Challenge 2024",
      "iconUrl": "https://example.com/badge2024.png",
      "rarity": "epic",
      "earnedCount": 156
    },
    "eventId": "evt_old",
    "event": { /* LimitedEvent object */ },
    "earnedAt": "2024-03-25T14:30:00Z",
    "isFeatured": true,
    "featuredOrder": 0
  }
]
```

**Logic:**
1. Get user profile from auth session
2. Query `user_limited_badge` where `user_profile_id = profile.id`
3. Join with `limited_event` to get event and badge details
4. Return sorted by `earnedAt` descending

---

### 5. PUT `/api/user/limited-badges/featured`

**Description:** Update featured badges on user profile (max 5)

**Auth:** Required

**Request Body:**
```json
{
  "badgeIds": ["ub_xyz789", "ub_abc456", "ub_def789"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "featuredBadges": [
    /* Array of UserLimitedBadge objects that are now featured */
  ]
}
```

**Error Responses:**
- `400 Bad Request` - badgeIds not an array or length > 5
- `400 Bad Request` - One or more badge IDs don't belong to user
- `401 Unauthorized` - Not authenticated

**Logic:**
1. Validate badgeIds is array with length <= 5
2. Get user profile from auth session
3. Verify all badgeIds exist in `user_limited_badge` for this user
4. In transaction:
   - Set `isFeatured = false, featuredOrder = null` for all user's badges
   - Set `isFeatured = true, featuredOrder = index` for each badge in badgeIds
5. Return updated featured badges

---

## Core Business Logic

### Progress Update on Check-out

When a user checks out from a masjid, you must update their event progress. This is the critical integration point.

#### Check-out Context Data

You'll need this data when processing event progress:

```typescript
interface CheckoutContext {
  userProfileId: string;
  masjidId: string;
  masjidName: string;
  districtCode: string;      // From masjid record
  districtName: string;      // From masjid record
  checkInId: string;
  checkInAt: Date;
  checkOutAt: Date;
  prayerName: string | null; // 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null
  isFirstVisitToMasjid: boolean;
}
```

#### Progress Update Algorithm

```
1. Get all active events (status = 'active' AND startDateTime <= NOW() <= endDateTime)

2. For each active event:
   a. Check if user has participation record
      - If not, CREATE one with initialized mission_progress

   b. Skip if participation.isCompleted = true

   c. For each mission in event.missions:
      - Update progress based on mission type (see below)

   d. Check if all missions are completed
      - If yes:
        * Set participation.isCompleted = true
        * Set participation.completedAt = NOW()
        * Set participation.badgeEarned = true
        * Set participation.badgeEarnedAt = NOW()
        * CREATE user_limited_badge record
        * ADD bonusPoints to user_profile.totalPoints and monthlyPoints

3. Return progress updates to include in check-out response
```

#### Mission Progress Logic by Type

**1. `unique_masjids`**
```javascript
// Only count if masjid not already visited in this event
if (!progress.masjidIdsVisited.includes(context.masjidId)) {
  progress.masjidIdsVisited.push(context.masjidId);
  progress.currentProgress = progress.masjidIdsVisited.length;
  if (progress.currentProgress >= mission.targetCount) {
    progress.isCompleted = true;
  }
}
```

**2. `checkin_count`**
```javascript
// Always increment
progress.currentProgress += 1;
if (progress.currentProgress >= mission.targetCount) {
  progress.isCompleted = true;
}
```

**3. `prayer_streak`**
```javascript
// Track unique days visited, calculate consecutive days
const today = context.checkOutAt.toDateString();
if (!progress.datesVisited.includes(today)) {
  progress.datesVisited.push(today);
  // Sort dates and calculate streak
  progress.currentProgress = calculateConsecutiveDays(progress.datesVisited);
  if (progress.currentProgress >= mission.targetCount) {
    progress.isCompleted = true;
  }
}
```

**4. `specific_masjids`**
```javascript
// Only count if this masjid is in the target list
if (mission.masjidIds.includes(context.masjidId)) {
  if (!progress.masjidIdsVisited.includes(context.masjidId)) {
    progress.masjidIdsVisited.push(context.masjidId);
    progress.currentProgress = progress.masjidIdsVisited.length;
    if (progress.currentProgress >= mission.targetCount) {
      progress.isCompleted = true;
    }
  }
}
```

**5. `district_coverage`**
```javascript
// Track unique districts visited
if (!progress.districtsVisited.includes(context.districtCode)) {
  progress.districtsVisited.push(context.districtCode);
  progress.currentProgress = progress.districtsVisited.length;
  if (progress.currentProgress >= mission.targetCount) {
    progress.isCompleted = true;
  }
}
```

**6. `prayer_times`**
```javascript
// Track unique prayer times checked in during
if (context.prayerName && mission.prayerNames?.includes(context.prayerName)) {
  if (!progress.prayerNamesCompleted.includes(context.prayerName)) {
    progress.prayerNamesCompleted.push(context.prayerName);
    progress.currentProgress = progress.prayerNamesCompleted.length;
    if (progress.currentProgress >= mission.targetCount) {
      progress.isCompleted = true;
    }
  }
}
```

---

## Integration Points

### 1. Check-out Endpoint Modification

Your existing `POST /masjids/:id/checkout` endpoint needs to call the progress service:

```typescript
// In your check-out handler, after updating check_in record:

// 1. Build checkout context
const checkoutContext = {
  userProfileId: profile.id,
  masjidId: checkIn.masjidId,
  masjidName: checkIn.masjidName,
  districtCode: masjid.districtCode,  // from masjid lookup
  districtName: masjid.districtName,
  checkInId: checkIn.id,
  checkInAt: checkIn.checkInAt,
  checkOutAt: new Date(),
  prayerName: checkIn.prayerName,
  isFirstVisitToMasjid: checkIn.isFirstVisitToMasjid,
};

// 2. Process event progress
const eventProgressUpdates = await processEventProgress(db, checkoutContext);

// 3. Include in response
return res.json({
  success: true,
  message: 'Check-out successful',
  pointsEarned: pointsEarned,
  checkIn: checkIn,
  eventProgressUpdates: eventProgressUpdates,  // NEW
});
```

### 2. Event Progress Update Response Structure

Include this in the check-out response:

```typescript
interface EventProgressUpdate {
  eventId: string;
  eventName: string;
  missionId: string;
  missionDescription: string;
  previousProgress: number;
  newProgress: number;
  targetCount: number;
  missionCompleted: boolean;
  eventCompleted: boolean;
  badgeEarned: boolean;
}
```

---

## Scheduled Jobs

### Event Status Update Job

Run every 5-15 minutes to update event statuses:

```typescript
async function updateEventStatuses(db: DbClient) {
  const now = new Date();

  // Activate upcoming events
  await db.update(limitedEvent)
    .set({ status: 'active', updatedAt: now })
    .where(
      and(
        eq(limitedEvent.status, 'upcoming'),
        lte(limitedEvent.startDateTime, now)
      )
    );

  // Complete active events
  await db.update(limitedEvent)
    .set({ status: 'completed', updatedAt: now })
    .where(
      and(
        eq(limitedEvent.status, 'active'),
        lt(limitedEvent.endDateTime, now)
      )
    );
}
```

---

## Example Seed Data

### Creating a Limited Event

```sql
INSERT INTO limited_event (
  code,
  name,
  description,
  image_url,
  banner_url,
  status,
  start_date_time,
  end_date_time,
  missions,
  badge,
  bonus_points
) VALUES (
  'ramadan-2025',
  'Ramadan Challenge 2025',
  'Visit 10 unique masjids during the blessed month of Ramadan',
  'https://storage.example.com/events/ramadan-2025.png',
  'https://storage.example.com/events/ramadan-2025-banner.png',
  'upcoming',
  '2025-03-01 00:00:00+00',
  '2025-03-31 23:59:59+00',
  '[
    {
      "id": "mission_unique_masjids",
      "type": "unique_masjids",
      "targetCount": 10,
      "description": "Visit 10 unique masjids during Ramadan"
    },
    {
      "id": "mission_prayer_times",
      "type": "prayer_times",
      "targetCount": 5,
      "description": "Check in during 5 different prayer times",
      "prayerNames": ["fajr", "dhuhr", "asr", "maghrib", "isha"]
    }
  ]'::jsonb,
  '{
    "id": "badge_ramadan_2025",
    "eventId": "",
    "name": "Ramadan Explorer 2025",
    "description": "Completed the Ramadan Challenge 2025",
    "iconUrl": "https://storage.example.com/badges/ramadan-2025.png",
    "rarity": "epic"
  }'::jsonb,
  500
);
```

### More Event Examples

**Weekly Challenge:**
```json
{
  "code": "weekly-10",
  "name": "Weekly Explorer",
  "description": "Visit 5 unique masjids this week",
  "missions": [
    {
      "id": "m1",
      "type": "unique_masjids",
      "targetCount": 5,
      "description": "Visit 5 unique masjids"
    }
  ],
  "badge": {
    "id": "badge_weekly_10",
    "name": "Weekly Explorer",
    "rarity": "common"
  },
  "bonusPoints": 100
}
```

**District Coverage:**
```json
{
  "code": "selangor-explorer",
  "name": "Selangor Explorer",
  "description": "Visit masjids in 5 different districts of Selangor",
  "missions": [
    {
      "id": "m1",
      "type": "district_coverage",
      "targetCount": 5,
      "description": "Visit 5 different districts"
    }
  ],
  "badge": {
    "id": "badge_selangor_explorer",
    "name": "Selangor Explorer",
    "rarity": "rare"
  },
  "bonusPoints": 250
}
```

---

## Testing Checklist

### API Endpoints
- [ ] GET /api/limited-events returns active events
- [ ] GET /api/limited-events/:id returns single event
- [ ] GET /api/user/limited-events returns user participations (auth required)
- [ ] GET /api/user/limited-badges returns user badges (auth required)
- [ ] PUT /api/user/limited-badges/featured updates featured badges
- [ ] PUT /api/user/limited-badges/featured rejects > 5 badges
- [ ] PUT /api/user/limited-badges/featured rejects invalid badge IDs

### Progress Tracking
- [ ] unique_masjids increments correctly
- [ ] unique_masjids doesn't count same masjid twice
- [ ] checkin_count increments every check-out
- [ ] prayer_streak calculates consecutive days
- [ ] specific_masjids only counts target masjids
- [ ] district_coverage tracks unique districts
- [ ] prayer_times tracks unique prayer names

### Event Completion
- [ ] Badge awarded when all missions complete
- [ ] Bonus points added to user profile
- [ ] Participation marked as completed
- [ ] user_limited_badge record created

### Scheduled Jobs
- [ ] upcoming events activate when startDateTime reached
- [ ] active events complete when endDateTime passed

---

## Files Reference

The frontend types are defined in:
- `/types/limited-event.ts` - Event and badge types
- `/types/cosmetics.ts` - Cosmetic system types

The frontend API client is in:
- `/lib/api.ts` - Functions: `getActiveLimitedEvents`, `getUserEventParticipations`, `getUserLimitedBadges`, `updateFeaturedBadges`

Frontend components that consume this data:
- `/hooks/use-limited-events.ts`
- `/hooks/use-user-event-participations.ts`
- `/hooks/use-user-limited-badges.ts`
- `/components/events/` - Event display components
- `/components/profile/limited-badge-showcase.tsx`
- `/components/profile/badge-selector-modal.tsx`
- `/components/profile/featured-badge-pills.tsx`

---

## Notes

1. **Auto-join**: When a user checks out during an active event, automatically create a participation record if they don't have one.

2. **Idempotency**: Mission progress should be idempotent - checking out at the same masjid twice shouldn't double-count.

3. **Timezones**: All timestamps should be stored in UTC. Frontend handles display timezone.

4. **Badge Earned Count**: This is calculated dynamically via COUNT query, not stored.

5. **Featured Order**: 0 is the first position, 4 is the last (max 5 badges).

6. **Backwards Compatibility**: The check-out response should include eventProgressUpdates even if empty array.
