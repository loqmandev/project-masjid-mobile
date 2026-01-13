# Backend Endpoints Implementation Plan

## Overview

Implement all backend endpoints for the Jejak Masjid gamification features based on `DATABASE_SCHEMA.md`.

### Step 3: Implement Endpoints

#### User Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get current user's gamification profile |
| PUT | `/api/user/profile` | Update privacy settings & alias |

#### Achievement Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/achievements` | List all achievement definitions |
| GET | `/api/user/achievements` | Get user's achievement progress |

#### Check-in Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/masjids/:id/checkin` | Check-in (update existing to save to PostgreSQL) |
| POST | `/masjids/:id/checkout` | Check-out from masjid |
| GET | `/api/user/checkins` | Get user's check-in history |
| GET | `/api/user/checkins/active` | Get current active check-in |

#### Leaderboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard/monthly` | Top 8 monthly rankings |
| GET | `/api/leaderboard/global` | Global rankings with pagination |

#### Masjid Stats Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/masjids/:id/stats` | Get masjid visitor stats |

---

| Action | Points |
|--------|--------|
| Basic visit (completed) | 10 |
| Basic visit (incomplete) | 5 |
| Prayer time bonus | +10 |
| First visit to masjid | +5 |
| Achievement unlock | 25-200 (by tier) |

---

## Auth Protection

**Protected endpoints (require authentication):**
- All `/api/user/*` endpoints
- `POST /masjids/:id/checkin`
- `POST /masjids/:id/checkout`

**Public endpoints (no auth):**
- `GET /masjids/*` (read-only masjid data)
- `GET /api/achievements` (achievement catalog)
- `GET /api/leaderboard/*` (public leaderboards)

**Implementation:**
- Get session from Better Auth: `auth.api.getSession({ headers })`
- Return 401 if not authenticated
- Use `session.user.id` to identify user

---


1. Run migrations: `pnpm db:push`
2. Deploy: `pnpm deploy`
3. Test endpoints:
   - Auth flow with Google
   - Check-in/out cycle
   - Achievement progress
   - Leaderboard display
