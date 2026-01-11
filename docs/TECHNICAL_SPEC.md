# Masjid Go - Technical Specification Document

## Document Information
- **Version**: 2.0
- **Date**: January 2026
- **Status**: Draft
- **Architecture**: Serverless-First

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture (Serverless)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│     ┌─────────────────────────────────────────────────────────┐         │
│     │                  React Native App                        │         │
│     │              (iOS & Android - Expo)                      │         │
│     │                                                          │         │
│     │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │         │
│     │  │  Home   │ │ Explore │ │ Profile │ │ Leaderboard │   │         │
│     │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │         │
│     └──────────────────────────┬──────────────────────────────┘         │
│                                │                                         │
└────────────────────────────────┼─────────────────────────────────────────┘
                                 │ HTTPS
┌────────────────────────────────┼─────────────────────────────────────────┐
│                                ▼                                         │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────────────┐   │
│  │   Firebase   │      │  CloudFront  │      │      Route 53        │   │
│  │     Auth     │      │    (CDN)     │      │       (DNS)          │   │
│  │  (Google     │      └──────┬───────┘      └──────────────────────┘   │
│  │   OAuth)     │             │                                          │
│  └──────┬───────┘             │                                          │
│         │                     ▼                                          │
│         │           ┌─────────────────┐                                  │
│         │           │   API Gateway   │                                  │
│         │           │   (REST API)    │                                  │
│         │           └────────┬────────┘                                  │
│         │                    │                                           │
│         ▼                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     AWS LAMBDA FUNCTIONS                         │    │
│  │                                                                  │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐   │    │
│  │  │   Auth    │ │  Masjid   │ │   Visit   │ │  Achievement  │   │    │
│  │  │  Handler  │ │  Handler  │ │  Handler  │ │   Handler     │   │    │
│  │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └───────┬───────┘   │    │
│  │        │             │             │               │            │    │
│  │  ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐ ┌──────┴──────┐    │    │
│  │  │  Points   │ │Leaderboard│ │   Photo   │ │Contribution │    │    │
│  │  │  Handler  │ │  Handler  │ │  Handler  │ │  Handler    │    │    │
│  │  └───────────┘ └───────────┘ └───────────┘ └─────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                 │                                        │
│                                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        DATA LAYER                                │    │
│  │                                                                  │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │    │
│  │  │    DynamoDB     │  │       S3        │  │       SQS       │  │    │
│  │  │   (Primary DB)  │  │    (Photos)     │  │  (Async Tasks)  │  │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │    │
│  │                                                                  │    │
│  │  ┌─────────────────┐  ┌─────────────────┐                       │    │
│  │  │    CloudWatch   │  │      FCM        │                       │    │
│  │  │  (Logs/Metrics) │  │ (Push Notifs)   │                       │    │
│  │  └─────────────────┘  └─────────────────┘                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│                         AWS REGION: ap-southeast-1                       │
│                         (Singapore - closest to Malaysia)                │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Mobile App** | React Native (Expo) | Cross-platform, rapid development, OTA updates |
| **State Management** | Zustand | Lightweight, simple API, good for small teams |
| **UI Library** | React Native Paper + Custom | Material Design 3, Islamic-themed customization |
| **Animations** | React Native Reanimated | Smooth 60fps animations for gamification |
| **Maps** | React Native Maps | List-first approach, map as secondary view |
| **Authentication** | Firebase Auth | Google OAuth, easy integration, free tier |
| **API Gateway** | AWS API Gateway | Serverless, auto-scaling, built-in throttling |
| **Compute** | AWS Lambda (Node.js 20) | Pay-per-use, auto-scaling, no server management |
| **Database** | Amazon DynamoDB | Serverless, fast, cost-effective at scale |
| **File Storage** | Amazon S3 | Photo storage, CDN-ready |
| **Message Queue** | Amazon SQS | Async processing, achievement calculations |
| **CDN** | Amazon CloudFront | Fast content delivery in Malaysia |
| **Push Notifications** | Firebase Cloud Messaging | Free, reliable, cross-platform |
| **Monitoring** | AWS CloudWatch | Native AWS integration |
| **IaC** | AWS SAM / Serverless Framework | Infrastructure as code |

### 1.3 Future Enhancements (Post-Funding)

| Component | Current | Future Enhancement |
|-----------|---------|-------------------|
| Caching | DynamoDB DAX (if needed) | Amazon ElastiCache (Redis) |
| Search | DynamoDB queries | Amazon OpenSearch |
| Real-time | Polling | WebSocket via API Gateway |
| Analytics | CloudWatch | Amazon QuickSight |

---

## 2. Database Design (DynamoDB)

### 2.1 Single Table Design Philosophy

DynamoDB uses a single-table design with composite keys for efficient access patterns.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MASJIDGO TABLE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  PK (Partition Key)    │  SK (Sort Key)           │  Attributes...      │
├────────────────────────┼──────────────────────────┼─────────────────────┤
│  USER#<userId>         │  PROFILE                 │  User profile data  │
│  USER#<userId>         │  VISIT#<timestamp>       │  Visit record       │
│  USER#<userId>         │  ACHIEVEMENT#<code>      │  Achievement progress│
│  USER#<userId>         │  STATS                   │  Aggregated stats   │
├────────────────────────┼──────────────────────────┼─────────────────────┤
│  MASJID#<masjidId>     │  INFO                    │  Masjid details     │
│  MASJID#<masjidId>     │  FACILITY                │  Facilities data    │
│  MASJID#<masjidId>     │  PHOTO#<photoId>         │  Photo metadata     │
│  MASJID#<masjidId>     │  STATS                   │  Visit statistics   │
├────────────────────────┼──────────────────────────┼─────────────────────┤
│  STATE#<stateCode>     │  INFO                    │  State metadata     │
│  STATE#<stateCode>     │  DISTRICT#<districtId>   │  District info      │
├────────────────────────┼──────────────────────────┼─────────────────────┤
│  LEADERBOARD#MONTHLY   │  RANK#<rank>             │  Monthly rankings   │
│  LEADERBOARD#ALLTIME   │  RANK#<rank>             │  All-time rankings  │
├────────────────────────┼──────────────────────────┼─────────────────────┤
│  CONTRIBUTION#<id>     │  INFO                    │  Photo/update record│
├────────────────────────┼──────────────────────────┼─────────────────────┤
│  ACHIEVEMENT#<code>    │  INFO                    │  Achievement def    │
└────────────────────────┴──────────────────────────┴─────────────────────┘
```

### 2.2 Global Secondary Indexes (GSI)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GSI1 - Geolocation Queries                                              │
├────────────────────────┬────────────────────────────────────────────────┤
│  GSI1PK                │  GSI1SK                                        │
│  STATE#<stateCode>     │  DISTRICT#<districtCode>#MASJID#<masjidId>     │
│  (Query masjids by state/district)                                      │
└────────────────────────┴────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  GSI2 - Leaderboard Queries                                              │
├────────────────────────┬────────────────────────────────────────────────┤
│  GSI2PK                │  GSI2SK                                        │
│  LEADERBOARD#<period>  │  POINTS#<zeroPaddedPoints>#USER#<userId>       │
│  (Query top users by points - descending)                               │
└────────────────────────┴────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  GSI3 - User Visits by Masjid                                            │
├────────────────────────┬────────────────────────────────────────────────┤
│  GSI3PK                │  GSI3SK                                        │
│  MASJID#<masjidId>     │  VISITOR#<timestamp>#USER#<userId>             │
│  (Query visitors to a masjid)                                           │
└────────────────────────┴────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  GSI4 - Pending Contributions (for moderation)                           │
├────────────────────────┬────────────────────────────────────────────────┤
│  GSI4PK                │  GSI4SK                                        │
│  CONTRIBUTION#PENDING  │  CREATED#<timestamp>#<contributionId>          │
│  (Query pending contributions for admin review)                         │
└────────────────────────┴────────────────────────────────────────────────┘
```

### 2.3 Data Models

#### 2.3.1 User Profile
```typescript
interface UserProfile {
  PK: `USER#${string}`;           // USER#uuid
  SK: 'PROFILE';

  // Core fields
  userId: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;

  // Stats (denormalized for fast reads)
  totalPoints: number;
  totalVisits: number;
  uniqueMasjidsVisited: number;

  // Preferences
  preferredLanguage: 'ms' | 'en';
  notificationsEnabled: boolean;
  isAnonymousOnLeaderboard: boolean;

  // Tracking
  createdAt: string;              // ISO 8601
  updatedAt: string;
  lastActiveAt: string;

  // GSI2 for leaderboard
  GSI2PK: 'LEADERBOARD#ALLTIME';
  GSI2SK: `POINTS#${string}#USER#${string}`; // Zero-padded points for sorting
}
```

#### 2.3.2 Masjid
```typescript
interface Masjid {
  PK: `MASJID#${string}`;         // MASJID#uuid
  SK: 'INFO';

  // Core fields
  masjidId: string;
  name: string;
  nameEn?: string;

  // Location
  coordinates: {
    lat: number;
    lng: number;
  };
  geohash: string;                // For proximity queries
  address: string;

  // Administrative
  stateCode: string;              // e.g., 'SGR'
  stateName: string;
  districtCode: string;
  districtName: string;

  // Metadata
  jakimCode?: string;
  contactPhone?: string;
  websiteUrl?: string;
  donationUrl?: string;           // Official donation link

  // Stats (denormalized)
  totalVisits: number;
  totalPhotos: number;
  firstVisitorId?: string;
  firstVisitorName?: string;

  // Status
  verified: boolean;
  active: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // GSI1 for geo queries
  GSI1PK: `STATE#${string}`;
  GSI1SK: `DISTRICT#${string}#MASJID#${string}`;
}
```

#### 2.3.3 Visit Record
```typescript
interface Visit {
  PK: `USER#${string}`;
  SK: `VISIT#${string}`;          // VISIT#ISO-timestamp

  // Core fields
  visitId: string;
  userId: string;
  masjidId: string;
  masjidName: string;             // Denormalized for display

  // Check-in
  checkInAt: string;
  checkInCoordinates: {
    lat: number;
    lng: number;
  };

  // Check-out
  checkOutAt?: string;
  checkOutCoordinates?: {
    lat: number;
    lng: number;
  };

  // Status
  status: 'checked_in' | 'completed' | 'incomplete';

  // Points
  pointsEarned: number;
  pointsBreakdown: {
    base: number;
    prayerTimeBonus: number;
    firstVisitorBonus: number;
  };

  // Context
  isPrayerTime: boolean;
  prayerName?: 'subuh' | 'zohor' | 'asar' | 'maghrib' | 'isyak';
  isFirstVisit: boolean;          // User's first visit to this masjid
  isFirstVisitor: boolean;        // First ever visitor to this masjid

  // Duration
  durationMinutes?: number;

  // GSI3 for masjid visitor queries
  GSI3PK: `MASJID#${string}`;
  GSI3SK: `VISITOR#${string}#USER#${string}`;
}
```

#### 2.3.4 User Achievement Progress
```typescript
interface UserAchievement {
  PK: `USER#${string}`;
  SK: `ACHIEVEMENT#${string}`;    // ACHIEVEMENT#explorer_5

  achievementCode: string;
  userId: string;

  // Progress tracking
  progress: {
    current: number;
    required: number;
    percentage: number;
  };

  // For complex achievements
  progressDetails?: {
    visitedMasjidIds?: string[];        // For explorer achievements
    visitedDistrictCodes?: string[];    // For district completionist
    prayerTimesVisited?: string[];      // For prayer warrior
  };

  // Status
  unlocked: boolean;
  unlockedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

#### 2.3.5 Contribution (Photo/Update)
```typescript
interface Contribution {
  PK: `CONTRIBUTION#${string}`;
  SK: 'INFO';

  contributionId: string;
  type: 'photo' | 'facility_update' | 'donation_click';

  // References
  userId: string;
  userName: string;
  masjidId: string;
  masjidName: string;
  visitId?: string;

  // Content
  photoUrl?: string;              // S3 URL for photos
  photoCategory?: 'exterior' | 'interior' | 'wudhu' | 'parking' | 'facilities';
  facilityUpdates?: {
    type: string;
    available: boolean;
    notes?: string;
  }[];

  // Moderation
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;

  // Points
  pointsAwarded: number;

  // Timestamps
  createdAt: string;

  // GSI4 for pending moderation
  GSI4PK?: 'CONTRIBUTION#PENDING';
  GSI4SK?: `CREATED#${string}#${string}`;
}
```

#### 2.3.6 Leaderboard Entry
```typescript
interface LeaderboardEntry {
  PK: `LEADERBOARD#${'MONTHLY' | 'ALLTIME'}`;
  SK: `RANK#${string}`;           // Zero-padded rank: RANK#000001

  userId: string;
  displayName: string;
  avatarUrl?: string;
  isAnonymous: boolean;

  totalPoints: number;
  totalVisits: number;

  topAchievementCode?: string;
  topAchievementBadgeUrl?: string;

  // For monthly
  periodStart?: string;
  periodEnd?: string;

  updatedAt: string;
}
```

### 2.4 Access Patterns

| Access Pattern | Key Condition | Index |
|----------------|---------------|-------|
| Get user profile | PK = USER#id, SK = PROFILE | Main |
| Get user visits | PK = USER#id, SK begins_with VISIT# | Main |
| Get user achievements | PK = USER#id, SK begins_with ACHIEVEMENT# | Main |
| Get masjid info | PK = MASJID#id, SK = INFO | Main |
| Get masjid photos | PK = MASJID#id, SK begins_with PHOTO# | Main |
| List masjids in state | GSI1PK = STATE#code | GSI1 |
| List masjids in district | GSI1PK = STATE#code, GSI1SK begins_with DISTRICT#code | GSI1 |
| Get leaderboard | GSI2PK = LEADERBOARD#period, limit 100 | GSI2 |
| Get masjid visitors | GSI3PK = MASJID#id | GSI3 |
| Get pending contributions | GSI4PK = CONTRIBUTION#PENDING | GSI4 |

---

## 3. API Specifications (Lambda)

### 3.1 API Structure

```
/api/v1
├── /auth
│   ├── POST /register          # Create user profile after Firebase auth
│   └── POST /sync              # Sync Firebase token, get/refresh JWT
│
├── /users
│   ├── GET /me                 # Get current user profile
│   ├── PATCH /me               # Update profile
│   └── GET /me/stats           # Get detailed stats
│
├── /masjids
│   ├── GET /nearby             # List masjids near coordinates
│   ├── GET /:id                # Get masjid details
│   └── GET /:id/photos         # Get masjid photos
│
├── /visits
│   ├── POST /check-in          # Check in to masjid
│   ├── POST /:id/check-out     # Check out from masjid
│   ├── GET /active             # Get active check-in
│   └── GET /history            # Get visit history
│
├── /achievements
│   ├── GET /                   # Get all achievements with progress
│   └── GET /:code              # Get specific achievement details
│
├── /leaderboard
│   ├── GET /monthly            # Monthly leaderboard
│   └── GET /alltime            # All-time leaderboard
│
├── /contributions
│   ├── POST /photo             # Upload photo
│   ├── POST /facility          # Update facility info
│   └── POST /donation-click    # Record donation link click
│
└── /admin (separate API)
    ├── GET /contributions/pending
    ├── POST /contributions/:id/approve
    └── POST /contributions/:id/reject
```

### 3.2 Lambda Function Structure

```
functions/
├── auth/
│   ├── register.ts
│   └── sync.ts
├── users/
│   ├── getMe.ts
│   ├── updateMe.ts
│   └── getStats.ts
├── masjids/
│   ├── getNearby.ts
│   ├── getById.ts
│   └── getPhotos.ts
├── visits/
│   ├── checkIn.ts
│   ├── checkOut.ts
│   ├── getActive.ts
│   └── getHistory.ts
├── achievements/
│   ├── getAll.ts
│   └── getByCode.ts
├── leaderboard/
│   ├── getMonthly.ts
│   └── getAllTime.ts
├── contributions/
│   ├── uploadPhoto.ts
│   ├── updateFacility.ts
│   └── recordDonationClick.ts
├── workers/                    # SQS-triggered
│   ├── processAchievements.ts
│   ├── updateLeaderboard.ts
│   └── processPhotoModeration.ts
└── shared/
    ├── dynamodb.ts
    ├── auth.ts
    ├── validation.ts
    └── responses.ts
```

### 3.3 Key API Endpoints

#### POST /api/v1/visits/check-in

**Lambda Handler:**
```typescript
// functions/visits/checkIn.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { verifyToken } from '../shared/auth';
import { calculateDistance, checkPrayerTime } from '../shared/utils';

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sqs = new SQSClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // 1. Verify JWT
    const user = await verifyToken(event.headers.Authorization);

    // 2. Parse request
    const { masjidId, coordinates, accuracyMeters } = JSON.parse(event.body || '{}');

    // 3. Check for active visit
    const activeVisit = await getActiveVisit(user.userId);
    if (activeVisit) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          success: false,
          error: 'You already have an active check-in',
          activeVisit
        })
      };
    }

    // 4. Get masjid and verify proximity
    const masjid = await getMasjid(masjidId);
    const distance = calculateDistance(coordinates, masjid.coordinates);

    if (distance > 100) {
      return {
        statusCode: 422,
        body: JSON.stringify({
          success: false,
          error: `You are ${Math.round(distance)}m away. Please get within 100m of the masjid.`
        })
      };
    }

    // 5. Check prayer time
    const prayerTimeInfo = await checkPrayerTime(new Date(), masjid.stateCode);

    // 6. Check if first visitor
    const isFirstVisitor = !masjid.firstVisitorId;

    // 7. Check if user's first visit to this masjid
    const isFirstVisit = await checkFirstVisitToMasjid(user.userId, masjidId);

    // 8. Create visit record
    const visit = {
      PK: `USER#${user.userId}`,
      SK: `VISIT#${new Date().toISOString()}`,
      visitId: generateId(),
      userId: user.userId,
      masjidId,
      masjidName: masjid.name,
      checkInAt: new Date().toISOString(),
      checkInCoordinates: coordinates,
      status: 'checked_in',
      isPrayerTime: prayerTimeInfo.isPrayerTime,
      prayerName: prayerTimeInfo.prayerName,
      isFirstVisit,
      isFirstVisitor,
      pointsEarned: 0,
      GSI3PK: `MASJID#${masjidId}`,
      GSI3SK: `VISITOR#${new Date().toISOString()}#USER#${user.userId}`
    };

    await dynamodb.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: visit
    }));

    // 9. Update masjid first visitor if applicable
    if (isFirstVisitor) {
      await dynamodb.send(new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { PK: `MASJID#${masjidId}`, SK: 'INFO' },
        UpdateExpression: 'SET firstVisitorId = :uid, firstVisitorName = :name',
        ExpressionAttributeValues: {
          ':uid': user.userId,
          ':name': user.displayName
        }
      }));
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        data: {
          visitId: visit.visitId,
          masjid: { id: masjidId, name: masjid.name },
          checkInAt: visit.checkInAt,
          minimumCheckoutAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          isPrayerTime: visit.isPrayerTime,
          prayerName: visit.prayerName,
          isFirstVisit,
          isFirstVisitor,
          message: isFirstVisitor
            ? 'You are the first explorer at this masjid! +25 bonus points await!'
            : (prayerTimeInfo.isPrayerTime
              ? `Visiting during ${prayerTimeInfo.prayerName}! 2x points multiplier active!`
              : 'Check-in successful! Stay for 5 minutes to complete your visit.')
        }
      })
    };
  } catch (error) {
    console.error('Check-in error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
};
```

#### POST /api/v1/visits/:id/check-out

```typescript
// functions/visits/checkOut.ts
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const user = await verifyToken(event.headers.Authorization);
    const { coordinates } = JSON.parse(event.body || '{}');
    const visitId = event.pathParameters?.id;

    // 1. Get the active visit
    const visit = await getVisitById(user.userId, visitId);

    if (!visit || visit.status !== 'checked_in') {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: 'Active visit not found' })
      };
    }

    // 2. Check minimum time (5 minutes)
    const checkInTime = new Date(visit.checkInAt).getTime();
    const now = Date.now();
    const elapsedMinutes = (now - checkInTime) / 60000;

    if (elapsedMinutes < 5) {
      const remainingSeconds = Math.ceil((5 - elapsedMinutes) * 60);
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: `Please wait ${remainingSeconds} more seconds before checking out.`,
          remainingSeconds
        })
      };
    }

    // 3. Verify proximity (150m for check-out)
    const masjid = await getMasjid(visit.masjidId);
    const distance = calculateDistance(coordinates, masjid.coordinates);

    // 4. Calculate points and status
    let status: 'completed' | 'incomplete' = 'completed';
    let pointsMultiplier = 1;

    if (distance > 150) {
      status = 'incomplete';
    }

    // Prayer time multiplier
    if (visit.isPrayerTime) {
      pointsMultiplier = 2;
    }

    const pointsBreakdown = {
      base: status === 'completed' ? 10 : 5,  // Half points for incomplete
      prayerTimeBonus: status === 'completed' ? (visit.isPrayerTime ? 10 : 0) : 0,
      firstVisitorBonus: visit.isFirstVisitor ? 25 : 0
    };

    const totalPoints = (pointsBreakdown.base * pointsMultiplier) +
                        pointsBreakdown.prayerTimeBonus +
                        pointsBreakdown.firstVisitorBonus;

    // 5. Update visit record
    await dynamodb.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { PK: visit.PK, SK: visit.SK },
      UpdateExpression: `
        SET #status = :status,
            checkOutAt = :checkOutAt,
            checkOutCoordinates = :coords,
            pointsEarned = :points,
            pointsBreakdown = :breakdown,
            durationMinutes = :duration
      `,
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':checkOutAt': new Date().toISOString(),
        ':coords': coordinates,
        ':points': totalPoints,
        ':breakdown': pointsBreakdown,
        ':duration': Math.round(elapsedMinutes)
      }
    }));

    // 6. Update user stats
    await updateUserStats(user.userId, totalPoints, visit.isFirstVisit);

    // 7. Update masjid stats
    await updateMasjidStats(visit.masjidId);

    // 8. Queue achievement processing
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.ACHIEVEMENT_QUEUE_URL,
      MessageBody: JSON.stringify({
        type: 'VISIT_COMPLETED',
        userId: user.userId,
        masjidId: visit.masjidId,
        visitData: {
          isPrayerTime: visit.isPrayerTime,
          prayerName: visit.prayerName,
          isFirstVisit: visit.isFirstVisit,
          stateCode: masjid.stateCode,
          districtCode: masjid.districtCode
        }
      })
    }));

    // 9. Check for newly unlocked achievements
    const newAchievements = await checkImmediateAchievements(user.userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          visitId,
          status,
          durationMinutes: Math.round(elapsedMinutes),
          pointsEarned: {
            ...pointsBreakdown,
            multiplier: pointsMultiplier,
            total: totalPoints
          },
          achievementsUnlocked: newAchievements,
          newTotalPoints: await getUserTotalPoints(user.userId),
          message: status === 'completed'
            ? `Visit complete! +${totalPoints} points earned!`
            : `Visit incomplete (left area). +${totalPoints} points earned.`
        }
      })
    };
  } catch (error) {
    console.error('Check-out error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
};
```

### 3.4 SQS Worker: Achievement Processing

```typescript
// functions/workers/processAchievements.ts
import { SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);

    switch (message.type) {
      case 'VISIT_COMPLETED':
        await processVisitAchievements(message);
        break;
      case 'PHOTO_APPROVED':
        await processPhotoAchievements(message);
        break;
      case 'DONATION_CLICKED':
        await processDonationAchievements(message);
        break;
    }
  }
};

async function processVisitAchievements(message: any) {
  const { userId, masjidId, visitData } = message;

  // Get current user stats
  const userStats = await getUserStats(userId);

  // Check Explorer achievements
  const explorerTiers = [
    { code: 'explorer_3', required: 3, name: 'Pengembara Pemula' },
    { code: 'explorer_5', required: 5, name: 'Pengembara Aktif' },
    { code: 'explorer_10', required: 10, name: 'Pengembara Dedikasi' },
    { code: 'explorer_20', required: 20, name: 'Pengembara Hebat' },
    { code: 'explorer_50', required: 50, name: 'Pengembara Legenda' },
  ];

  for (const tier of explorerTiers) {
    await updateAchievementProgress(userId, tier.code, {
      current: userStats.uniqueMasjidsVisited,
      required: tier.required
    });
  }

  // Check Prayer Warrior achievement
  if (visitData.isPrayerTime && visitData.prayerName) {
    await updatePrayerWarriorProgress(userId, visitData.prayerName);
  }

  // Check District/State completionist
  await updateGeographicAchievements(userId, visitData.stateCode, visitData.districtCode);

  // Update leaderboard (async)
  await queueLeaderboardUpdate(userId);
}
```

---

## 4. Mobile App Design (Beautiful & Fun)

### 4.1 Design Philosophy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DESIGN PRINCIPLES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. ISLAMIC AESTHETIC                                                    │
│     - Geometric patterns inspired by Islamic art                         │
│     - Calming colors: Teal, Gold, Cream                                 │
│     - Subtle mosque silhouettes in backgrounds                          │
│                                                                          │
│  2. GAMIFICATION JOY                                                     │
│     - Satisfying animations for achievements                             │
│     - Progress bars and level indicators                                 │
│     - Celebratory confetti on milestones                                │
│                                                                          │
│  3. SIMPLICITY FIRST                                                     │
│     - One primary action per screen                                      │
│     - Clear visual hierarchy                                             │
│     - Minimal cognitive load                                             │
│                                                                          │
│  4. DELIGHTFUL INTERACTIONS                                              │
│     - Haptic feedback on key actions                                     │
│     - Smooth 60fps animations                                           │
│     - Meaningful micro-interactions                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Color Palette

```typescript
// theme/colors.ts
export const colors = {
  // Primary - Teal (Trust, Calm, Spiritual)
  primary: {
    50: '#E6F7F7',
    100: '#B3E8E8',
    200: '#80D9D9',
    300: '#4DCACA',
    400: '#26BEBE',
    500: '#00A9A5',  // Main primary
    600: '#008B88',
    700: '#006D6A',
    800: '#004F4D',
    900: '#003130',
  },

  // Secondary - Gold (Achievement, Reward, Premium)
  gold: {
    50: '#FFF9E6',
    100: '#FFEFB3',
    200: '#FFE580',
    300: '#FFDB4D',
    400: '#FFD426',
    500: '#FFCC00',  // Main gold
    600: '#D4AA00',
    700: '#AA8800',
    800: '#806600',
    900: '#554400',
  },

  // Neutrals
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Semantic
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Background
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    card: '#FFFFFF',
  }
};
```

### 4.3 App Navigation Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                           BOTTOM TAB NAVIGATION                          │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │          │  │          │  │          │  │          │  │          │  │
│  │   Home   │  │  Explore │  │  Check   │  │  Ranks   │  │  Profile │  │
│  │    🏠    │  │    🔍    │  │   In ✓   │  │    🏆    │  │    👤    │  │
│  │          │  │          │  │          │  │          │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Screen Designs

#### 4.4.1 Home Screen
```
┌─────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  Status Bar
├─────────────────────────────────────────┤
│                                         │
│  Assalamualaikum, Ahmad! 👋             │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  ╔═══════════════════════════════╗  ││
│  │  ║     YOUR JOURNEY              ║  ││
│  │  ║                               ║  ││
│  │  ║   🕌  12 Masjids Visited      ║  ││
│  │  ║                               ║  ││
│  │  ║   ⭐  350 Points              ║  ││
│  │  ║                               ║  ││
│  │  ║   🏆  3 Achievements          ║  ││
│  │  ║                               ║  ││
│  │  ╚═══════════════════════════════╝  ││
│  │      [Islamic geometric pattern]     ││
│  └─────────────────────────────────────┘│
│                                         │
│  Next Achievement                       │
│  ┌─────────────────────────────────────┐│
│  │ 🎯 Pengembara Hebat                 ││
│  │ ████████████░░░░░░░░  12/20 (60%)  ││
│  │ Visit 8 more masjids to unlock!     ││
│  └─────────────────────────────────────┘│
│                                         │
│  Nearby Masjids                         │
│  ┌─────────────────────────────────────┐│
│  │ 🕌 Masjid Sultan Salahuddin    1.2km││
│  │    Shah Alam, Selangor              ││
│  │    ✅ Visited                        ││
│  ├─────────────────────────────────────┤│
│  │ 🕌 Masjid Jamek Kg Baru       0.8km ││
│  │    Kuala Lumpur                     ││
│  │    🆕 New                           ││
│  ├─────────────────────────────────────┤│
│  │ 🕌 Masjid Negara              2.3km ││
│  │    Kuala Lumpur                     ││
│  │    ✅ Visited                        ││
│  └─────────────────────────────────────┘│
│                                         │
│  [View All Nearby →]                    │
│                                         │
├─────────────────────────────────────────┤
│  [🏠]    [🔍]    [✓]    [🏆]    [👤]  │
└─────────────────────────────────────────┘
```

#### 4.4.2 Check-In Screen (Active Visit)
```
┌─────────────────────────────────────────┐
│ ← Back            Check In              │
├─────────────────────────────────────────┤
│                                         │
│         ┌───────────────────────┐       │
│         │                       │       │
│         │    🕌                 │       │
│         │                       │       │
│         │  [Masjid Image]       │       │
│         │                       │       │
│         │                       │       │
│         └───────────────────────┘       │
│                                         │
│         Masjid Sultan Salahuddin        │
│         Shah Alam, Selangor             │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │     ⏱️  Time Remaining              ││
│  │                                     ││
│  │          3:42                       ││
│  │                                     ││
│  │     ████████████░░░░░░  75%        ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  🌙 Zohor Time Active!              ││
│  │  2x Points Multiplier               ││
│  └─────────────────────────────────────┘│
│                                         │
│  Points Preview                         │
│  ┌─────────────────────────────────────┐│
│  │  Base Visit          10 pts         ││
│  │  Prayer Multiplier   ×2             ││
│  │  ─────────────────────────          ││
│  │  Total              20 pts          ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │        [ CHECK OUT ]                ││
│  │        (Available in 3:42)          ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌───────────┐  ┌───────────────────┐  │
│  │  📷 Add   │  │  ℹ️ Update Info   │  │
│  │   Photo   │  │                   │  │
│  └───────────┘  └───────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  [🏠]    [🔍]    [✓]    [🏆]    [👤]  │
└─────────────────────────────────────────┘
```

#### 4.4.3 Achievement Unlocked Modal (Celebration!)
```
┌─────────────────────────────────────────┐
│                                         │
│           ✨ ✨ ✨ ✨ ✨ ✨ ✨             │
│                                         │
│         🎉 ACHIEVEMENT UNLOCKED! 🎉      │
│                                         │
│              ┌─────────┐                │
│              │         │                │
│              │   🏅    │                │
│              │  GOLD   │                │
│              │         │                │
│              └─────────┘                │
│                                         │
│           PENGEMBARA DEDIKASI           │
│                                         │
│        "Visited 10 unique masjids"      │
│                                         │
│             +50 Bonus Points!           │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │          [ SHARE ]                  ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │          [ CONTINUE ]               ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│           ✨ ✨ ✨ ✨ ✨ ✨ ✨             │
│                                         │
└─────────────────────────────────────────┘

[Animated confetti falling in background]
[Badge pulsing/glowing animation]
[Haptic feedback on unlock]
```

#### 4.4.4 Leaderboard Screen
```
┌─────────────────────────────────────────┐
│           Leaderboard          🔄       │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────┐ ┌────────────────┐  │
│  │    Monthly     │ │    All Time    │  │
│  │   [Selected]   │ │                │  │
│  └────────────────┘ └────────────────┘  │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │      🥇                             ││
│  │     /👤\      MasjidHero           ││
│  │    1,250 pts   42 masjids          ││
│  ├─────────────────────────────────────┤│
│  │  🥈 /👤\  ExplorerAhmad   980 pts  ││
│  ├─────────────────────────────────────┤│
│  │  🥉 /👤\  PengembaraKL    875 pts  ││
│  └─────────────────────────────────────┘│
│                                         │
│  4   /👤\  SarahVisitor      720 pts   │
│  5   /👤\  AdamMasjid        685 pts   │
│  6   /👤\  FatimahExplore    640 pts   │
│  7   /👤\  Anonymous         615 pts   │
│  8   /👤\  ZainalSeeker      590 pts   │
│  9   /👤\  AisyahPrayer      565 pts   │
│  10  /👤\  HafizWanderer     530 pts   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  📍 Your Rank                       ││
│  │                                     ││
│  │  #42  /👤\  You         350 pts    ││
│  │        12 masjids visited           ││
│  │                                     ││
│  │  8 pts to reach #41!               ││
│  └─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  [🏠]    [🔍]    [✓]    [🏆]    [👤]  │
└─────────────────────────────────────────┘
```

#### 4.4.5 Explore Screen (List View)
```
┌─────────────────────────────────────────┐
│  Explore                    📍 10km ▼   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🔍  Search masjid name...           ││
│  └─────────────────────────────────────┘│
│                                         │
│  Filter: [All ▼] [State ▼] [District ▼]│
│                                         │
│  23 masjids within 10km                │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🕌 ┌────────┐ Masjid Jamek Kg Baru ││
│  │    │ [img]  │ 0.8 km away          ││
│  │    └────────┘ Kuala Lumpur         ││
│  │                                     ││
│  │    🆕 Be the first visitor!        ││
│  │    +25 bonus points available       ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🕌 ┌────────┐ Masjid Sultan        ││
│  │    │ [img]  │ Salahuddin           ││
│  │    └────────┘ 1.2 km · Shah Alam   ││
│  │                                     ││
│  │    ✅ Visited · Last: 2 days ago   ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🕌 ┌────────┐ Masjid Negara        ││
│  │    │ [img]  │ 2.3 km away          ││
│  │    └────────┘ Kuala Lumpur         ││
│  │                                     ││
│  │    ✅ Visited · 3 times            ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🕌 ┌────────┐ Masjid Wilayah       ││
│  │    │ [img]  │ 3.1 km away          ││
│  │    └────────┘ Kuala Lumpur         ││
│  │                                     ││
│  │    🆕 Not visited yet              ││
│  └─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  [🏠]    [🔍]    [✓]    [🏆]    [👤]  │
└─────────────────────────────────────────┘
```

### 4.5 Animation Specifications

```typescript
// animations/achievements.ts
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  Easing
} from 'react-native-reanimated';

// Achievement unlock animation
export const useAchievementAnimation = () => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  const playUnlockAnimation = () => {
    // Badge entrance
    scale.value = withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );

    // Glow pulse
    rotation.value = withSequence(
      withSpring(10),
      withSpring(-10),
      withSpring(0)
    );

    // Fade in
    opacity.value = withSpring(1);

    // Trigger haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return { scale, rotation, opacity, playUnlockAnimation };
};

// Check-in button pulse
export const useCheckInPulse = (canCheckIn: boolean) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (canCheckIn) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [canCheckIn]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }]
  }));
};

// Points counter animation
export const usePointsCounter = (targetPoints: number) => {
  const [displayPoints, setDisplayPoints] = useState(0);

  useEffect(() => {
    let current = 0;
    const increment = Math.ceil(targetPoints / 30);
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetPoints) {
        setDisplayPoints(targetPoints);
        clearInterval(timer);
      } else {
        setDisplayPoints(current);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [targetPoints]);

  return displayPoints;
};
```

### 4.6 Project Structure (React Native)

```
src/
├── api/
│   ├── client.ts              # Axios with auth interceptor
│   ├── auth.ts
│   ├── masjids.ts
│   ├── visits.ts
│   ├── achievements.ts
│   ├── leaderboard.ts
│   └── contributions.ts
│
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── IslamicPattern.tsx  # SVG geometric patterns
│   │
│   ├── home/
│   │   ├── JourneyCard.tsx
│   │   ├── NextAchievement.tsx
│   │   └── NearbyMasjidsList.tsx
│   │
│   ├── masjid/
│   │   ├── MasjidCard.tsx
│   │   ├── MasjidDetails.tsx
│   │   ├── FacilitiesList.tsx
│   │   └── PhotoGallery.tsx
│   │
│   ├── visit/
│   │   ├── CheckInButton.tsx
│   │   ├── CheckOutTimer.tsx
│   │   ├── ActiveVisitCard.tsx
│   │   └── PointsPreview.tsx
│   │
│   ├── achievements/
│   │   ├── AchievementBadge.tsx
│   │   ├── AchievementCard.tsx
│   │   ├── AchievementProgress.tsx
│   │   └── UnlockModal.tsx     # Celebration modal
│   │
│   └── leaderboard/
│       ├── LeaderboardTabs.tsx
│       ├── RankingItem.tsx
│       └── UserRankCard.tsx
│
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── OnboardingScreen.tsx
│   │
│   ├── HomeScreen.tsx
│   ├── ExploreScreen.tsx
│   ├── CheckInScreen.tsx       # Central check-in action
│   ├── MasjidDetailScreen.tsx
│   ├── LeaderboardScreen.tsx
│   ├── AchievementsScreen.tsx
│   ├── ProfileScreen.tsx
│   └── VisitHistoryScreen.tsx
│
├── store/
│   ├── index.ts               # Zustand store
│   ├── authStore.ts
│   ├── masjidStore.ts
│   ├── visitStore.ts
│   └── achievementStore.ts
│
├── hooks/
│   ├── useLocation.ts
│   ├── useCheckIn.ts
│   ├── usePrayerTimes.ts
│   ├── useAchievements.ts
│   └── useAnimations.ts
│
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── shadows.ts
│
├── animations/
│   ├── achievements.ts
│   ├── transitions.ts
│   └── confetti.ts
│
├── utils/
│   ├── distance.ts
│   ├── formatters.ts
│   └── storage.ts
│
├── types/
│   └── index.ts
│
└── navigation/
    └── AppNavigator.tsx
```

---

## 5. Infrastructure (AWS Serverless)

### 5.1 AWS SAM Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Masjid Go Backend API

Globals:
  Function:
    Timeout: 30
    Runtime: nodejs20.x
    MemorySize: 256
    Environment:
      Variables:
        TABLE_NAME: !Ref MasjidGoTable
        ACHIEVEMENT_QUEUE_URL: !Ref AchievementQueue
        PHOTO_BUCKET: !Ref PhotoBucket

Resources:
  # API Gateway
  MasjidGoApi:
    Type: AWS::Serverless::Api
    Properties:
      Name: masjidgo-api
      StageName: prod
      Cors:
        AllowMethods: "'GET,POST,PUT,PATCH,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,Authorization'"
        AllowOrigin: "'*'"
      Auth:
        DefaultAuthorizer: FirebaseAuthorizer
        Authorizers:
          FirebaseAuthorizer:
            FunctionArn: !GetAtt AuthorizerFunction.Arn

  # DynamoDB Table
  MasjidGoTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: masjidgo
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
        - AttributeName: GSI1PK
          AttributeType: S
        - AttributeName: GSI1SK
          AttributeType: S
        - AttributeName: GSI2PK
          AttributeType: S
        - AttributeName: GSI2SK
          AttributeType: S
        - AttributeName: GSI3PK
          AttributeType: S
        - AttributeName: GSI3SK
          AttributeType: S
        - AttributeName: GSI4PK
          AttributeType: S
        - AttributeName: GSI4SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: GSI1
          KeySchema:
            - AttributeName: GSI1PK
              KeyType: HASH
            - AttributeName: GSI1SK
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: GSI2
          KeySchema:
            - AttributeName: GSI2PK
              KeyType: HASH
            - AttributeName: GSI2SK
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: GSI3
          KeySchema:
            - AttributeName: GSI3PK
              KeyType: HASH
            - AttributeName: GSI3SK
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: GSI4
          KeySchema:
            - AttributeName: GSI4PK
              KeyType: HASH
            - AttributeName: GSI4SK
              KeyType: RANGE
          Projection:
            ProjectionType: ALL

  # S3 Bucket for Photos
  PhotoBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: masjidgo-photos
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders: ['*']
            AllowedMethods: [GET, PUT]
            AllowedOrigins: ['*']

  # SQS Queue for Achievement Processing
  AchievementQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: masjidgo-achievements
      VisibilityTimeout: 60

  # Lambda Functions
  AuthorizerFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/auth/
      Handler: authorizer.handler

  CheckInFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/visits/
      Handler: checkIn.handler
      Events:
        Api:
          Type: Api
          Properties:
            RestApiId: !Ref MasjidGoApi
            Path: /api/v1/visits/check-in
            Method: POST
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref MasjidGoTable
        - SQSSendMessagePolicy:
            QueueName: !GetAtt AchievementQueue.QueueName

  CheckOutFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/visits/
      Handler: checkOut.handler
      Events:
        Api:
          Type: Api
          Properties:
            RestApiId: !Ref MasjidGoApi
            Path: /api/v1/visits/{id}/check-out
            Method: POST
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref MasjidGoTable
        - SQSSendMessagePolicy:
            QueueName: !GetAtt AchievementQueue.QueueName

  GetNearbyMasjidsFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/masjids/
      Handler: getNearby.handler
      Events:
        Api:
          Type: Api
          Properties:
            RestApiId: !Ref MasjidGoApi
            Path: /api/v1/masjids/nearby
            Method: GET
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref MasjidGoTable

  AchievementWorker:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/workers/
      Handler: processAchievements.handler
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt AchievementQueue.Arn
            BatchSize: 10
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref MasjidGoTable

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub "https://${MasjidGoApi}.execute-api.${AWS::Region}.amazonaws.com/prod"
```

### 5.2 Cost Estimation (MVP Scale)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MONTHLY COST ESTIMATE (100 MAU)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Service                          Usage              Est. Cost (USD)     │
│  ────────────────────────────────────────────────────────────────────   │
│  AWS Lambda                       50k invocations    $0.00 (Free tier)  │
│  API Gateway                      50k requests       $0.00 (Free tier)  │
│  DynamoDB                         5GB storage        $1.25              │
│                                   100k reads         $0.00 (Free tier)  │
│                                   50k writes         $0.00 (Free tier)  │
│  S3 (Photos)                      10GB storage       $0.23              │
│  CloudFront                       10GB transfer      $0.85              │
│  SQS                              10k messages       $0.00 (Free tier)  │
│  CloudWatch                       Basic logging      $0.00 (Free tier)  │
│  Firebase Auth                    100 users          $0.00 (Free tier)  │
│  Firebase FCM                     10k notifications  $0.00 (Free)       │
│  ────────────────────────────────────────────────────────────────────   │
│                                                                          │
│  TOTAL ESTIMATED MONTHLY COST:                       ~$2.50/month       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

Note: Costs will scale with usage. At 1000 MAU, expect ~$15-25/month.
      At 10,000 MAU, expect ~$100-150/month.
```

---

## 6. Security & Compliance

### 6.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       AUTHENTICATION FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. User taps "Sign in with Google"                                     │
│                    │                                                     │
│                    ▼                                                     │
│  2. Firebase Auth handles Google OAuth                                   │
│                    │                                                     │
│                    ▼                                                     │
│  3. App receives Firebase ID Token                                       │
│                    │                                                     │
│                    ▼                                                     │
│  4. App sends token to POST /api/v1/auth/sync                           │
│                    │                                                     │
│                    ▼                                                     │
│  5. Lambda verifies Firebase token with Firebase Admin SDK               │
│                    │                                                     │
│                    ▼                                                     │
│  6. Lambda creates/updates user in DynamoDB                              │
│                    │                                                     │
│                    ▼                                                     │
│  7. Lambda returns user profile + creates session                        │
│                    │                                                     │
│                    ▼                                                     │
│  8. App stores session, user is authenticated                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 API Gateway Authorizer

```typescript
// functions/auth/authorizer.ts
import { APIGatewayTokenAuthorizerHandler } from 'aws-lambda';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const handler: APIGatewayTokenAuthorizerHandler = async (event) => {
  try {
    const token = event.authorizationToken.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);

    return {
      principalId: decodedToken.uid,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: event.methodArn.split('/').slice(0, 2).join('/') + '/*'
        }]
      },
      context: {
        userId: decodedToken.uid,
        email: decodedToken.email || '',
      }
    };
  } catch (error) {
    console.error('Auth error:', error);
    throw new Error('Unauthorized');
  }
};
```

### 6.3 GPS Spoofing Prevention

```typescript
// shared/locationVerification.ts

interface LocationCheck {
  isValid: boolean;
  isSuspicious: boolean;
  suspicionReasons: string[];
}

export function verifyLocation(
  userCoords: { lat: number; lng: number },
  masjidCoords: { lat: number; lng: number },
  accuracyMeters: number,
  type: 'check_in' | 'check_out'
): LocationCheck {
  const suspicionReasons: string[] = [];

  // 1. Calculate distance
  const distance = calculateHaversineDistance(userCoords, masjidCoords);
  const maxRadius = type === 'check_in' ? 100 : 150;
  const isValid = distance <= maxRadius;

  // 2. Check for suspicious accuracy (too perfect)
  if (accuracyMeters < 3) {
    suspicionReasons.push('GPS accuracy suspiciously high');
  }

  // 3. Check for round coordinates (often from spoofing)
  if (isRoundCoordinate(userCoords.lat) || isRoundCoordinate(userCoords.lng)) {
    suspicionReasons.push('Coordinates appear artificially round');
  }

  // 4. Verify coordinates are in Malaysia
  if (!isInMalaysia(userCoords)) {
    suspicionReasons.push('Location outside Malaysia');
  }

  return {
    isValid,
    isSuspicious: suspicionReasons.length > 0,
    suspicionReasons
  };
}

function isRoundCoordinate(coord: number): boolean {
  const decimalPart = Math.abs(coord % 1);
  return decimalPart === 0 || decimalPart === 0.5;
}

function isInMalaysia(coords: { lat: number; lng: number }): boolean {
  // Malaysia bounding box (approximate)
  return (
    coords.lat >= 0.8 && coords.lat <= 7.5 &&
    coords.lng >= 99.5 && coords.lng <= 119.5
  );
}
```

---

## 7. Future Enhancements (Post-Funding)

### 7.1 Redis Integration (Caching Layer)

```typescript
// When budget allows, add ElastiCache Redis for:

// 1. Leaderboard caching (hot data)
const getLeaderboard = async (period: 'monthly' | 'alltime') => {
  const cacheKey = `leaderboard:${period}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fallback to DynamoDB
  const data = await queryLeaderboardFromDynamo(period);
  await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min TTL

  return data;
};

// 2. User session data
// 3. Rate limiting (more efficient than DynamoDB)
// 4. Real-time active visitors per masjid
```

### 7.2 WebSocket Support (Real-time)

```yaml
# Add to SAM template for real-time features
WebSocketApi:
  Type: AWS::ApiGatewayV2::Api
  Properties:
    Name: masjidgo-websocket
    ProtocolType: WEBSOCKET
    RouteSelectionExpression: "$request.body.action"

# Use cases:
# - Live visitor count at masjids
# - Real-time leaderboard updates
# - Achievement unlock notifications
# - Friend activity feed
```

---

## 8. Appendices

### Appendix A: Achievement Definitions

```typescript
const ACHIEVEMENTS = [
  // Explorer tiers
  { code: 'explorer_3', type: 'explorer', name: 'Pengembara Pemula', required: 3, badge: 'bronze' },
  { code: 'explorer_5', type: 'explorer', name: 'Pengembara Aktif', required: 5, badge: 'silver' },
  { code: 'explorer_10', type: 'explorer', name: 'Pengembara Dedikasi', required: 10, badge: 'gold' },
  { code: 'explorer_20', type: 'explorer', name: 'Pengembara Hebat', required: 20, badge: 'platinum' },
  { code: 'explorer_50', type: 'explorer', name: 'Pengembara Legenda', required: 50, badge: 'diamond' },

  // Prayer Warrior
  { code: 'prayer_warrior', type: 'special', name: 'Pahlawan Solat',
    requirement: { visitAllPrayerTimes: true } },

  // Photographer
  { code: 'photographer_10', type: 'special', name: 'Jurugambar Masjid', required: 10 },

  // Donor
  { code: 'donor_10', type: 'special', name: 'Dermawan', required: 10 },

  // Geographic (dynamically generated per district/state)
  // { code: 'district_petaling', type: 'district', name: 'Penakluk Daerah Petaling', ... }
  // { code: 'state_selangor', type: 'state', name: 'Juara Negeri Selangor', ... }
];
```

### Appendix B: Prayer Time Integration

```typescript
// Use JAKIM e-Solat API or calculation library
import { PrayTimes } from 'praytimes';

const pt = new PrayTimes('JAKIM'); // Malaysian calculation method

function getPrayerTimes(lat: number, lng: number, date: Date) {
  const times = pt.getTimes(date, [lat, lng], '+8');

  return {
    subuh: times.fajr,
    zohor: times.dhuhr,
    asar: times.asr,
    maghrib: times.maghrib,
    isyak: times.isha,
  };
}

function isPrayerTime(currentTime: Date, prayerTimes: any): { is: boolean; name?: string } {
  const WINDOW_MINUTES = 30;

  for (const [name, time] of Object.entries(prayerTimes)) {
    const prayerDate = parseTimeToDate(time as string, currentTime);
    const windowStart = new Date(prayerDate.getTime() - WINDOW_MINUTES * 60000);
    const windowEnd = new Date(prayerDate.getTime() + WINDOW_MINUTES * 60000);

    if (currentTime >= windowStart && currentTime <= windowEnd) {
      return { is: true, name };
    }
  }

  return { is: false };
}
```

### Appendix C: State & District Codes

```typescript
const MALAYSIA_GEOGRAPHY = {
  states: [
    { code: 'JHR', name: 'Johor', nameEn: 'Johor' },
    { code: 'KDH', name: 'Kedah', nameEn: 'Kedah' },
    { code: 'KTN', name: 'Kelantan', nameEn: 'Kelantan' },
    { code: 'MLK', name: 'Melaka', nameEn: 'Malacca' },
    { code: 'NSN', name: 'Negeri Sembilan', nameEn: 'Negeri Sembilan' },
    { code: 'PHG', name: 'Pahang', nameEn: 'Pahang' },
    { code: 'PRK', name: 'Perak', nameEn: 'Perak' },
    { code: 'PLS', name: 'Perlis', nameEn: 'Perlis' },
    { code: 'PNG', name: 'Pulau Pinang', nameEn: 'Penang' },
    { code: 'SBH', name: 'Sabah', nameEn: 'Sabah' },
    { code: 'SWK', name: 'Sarawak', nameEn: 'Sarawak' },
    { code: 'SGR', name: 'Selangor', nameEn: 'Selangor' },
    { code: 'TRG', name: 'Terengganu', nameEn: 'Terengganu' },
    { code: 'KUL', name: 'Kuala Lumpur', nameEn: 'Kuala Lumpur' },
    { code: 'LBN', name: 'Labuan', nameEn: 'Labuan' },
    { code: 'PJY', name: 'Putrajaya', nameEn: 'Putrajaya' },
  ],
  // Districts loaded from separate data file
};
```
