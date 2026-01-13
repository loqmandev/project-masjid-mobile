# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start the development server
npx expo start

# Platform-specific development
npm run android    # Start with Android
npm run ios        # Start with iOS
npm run web        # Start with web

# Linting
npm run lint       # Run ESLint via expo lint
```

## Project Overview

**Jejak Masjid** - A gamified mobile app that encourages Muslims in Malaysia to visit masjids, check in, and earn points and achievements. Inspired by Pokemon Go but for mosque visits.

See `docs/PRD.md` for product requirements and `docs/TECHNICAL_SPEC.md` for technical architecture.

## Architecture

Expo 54 React Native app with file-based routing (expo-router), targeting iOS, Android, and web.

### Routing Structure

```
app/
├── _layout.tsx              # Root layout with Stack navigator & custom theme
├── (tabs)/                   # Tab-based navigation (5 tabs)
│   ├── _layout.tsx          # Tab bar config with elevated Check-In button
│   ├── index.tsx            # Home - Journey stats, nearby masjids
│   ├── explore.tsx          # Explore - Search/filter masjids list
│   ├── checkin.tsx          # Check In - Active visit with timer
│   ├── leaderboard.tsx      # Ranks - Monthly/all-time leaderboards
│   └── profile.tsx          # Profile - User stats, achievements, settings
├── masjid/[id].tsx          # Masjid detail screen (dynamic route)
├── auth/login.tsx           # Google OAuth login screen
└── achievements.tsx         # Full achievements list
```

### Path Aliases

`@/*` maps to project root (tsconfig.json):
```typescript
import { Colors, primary, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/card';
```

### Key Components

**UI Primitives** (`components/ui/`):
- `card.tsx` - Card with variants: default, outlined, elevated
- `button.tsx` - Button with variants: primary, secondary, outline, ghost, gold
- `badge.tsx` - Status badges with semantic colors
- `progress-bar.tsx` - Animated progress bar with Reanimated

**Theme** (`constants/theme.ts`):
- Primary: Teal palette (#00A9A5)
- Secondary: Gold palette (#FFCC00) for achievements
- Badge colors: bronze, silver, gold, platinum, diamond
- Exports: `Colors`, `Spacing`, `BorderRadius`, `Typography`

### Design Patterns

**Theming**: Custom light/dark themes extending React Navigation's themes. Access via `useColorScheme()` hook.

**Mock Data**: Each screen uses mock data objects at top of file. Replace with API calls when backend is ready.

**State Management**: Currently local state. Plan to use Zustand for global state (user, visits, achievements).

**Animations**: React Native Reanimated for:
- Check-in button pulse animation
- Progress bar fill animation
- Achievement unlock celebrations

### Backend (Planned)

- **Auth**: Firebase Auth (Google OAuth)
- **Database**: AWS DynamoDB (single-table design)
- **API**: AWS Lambda + API Gateway
- **Storage**: S3 for photos
- **Queue**: SQS for async achievement processing

See `docs/TECHNICAL_SPEC.md` for full API specifications and data models.
