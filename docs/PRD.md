# Masjid Go - Product Requirements Document (PRD)

## Document Information
- **Version**: 1.0
- **Date**: January 2026
- **Status**: Draft

---

## 1. Executive Summary

### 1.1 Product Overview
Masjid Go is a location-based mobile application inspired by Pokemon Go, designed to encourage Muslims in Malaysia to visit and engage with masjids (mosques) across the country. Users physically visit masjids, check in at the location, and earn points and achievements for their visits and contributions.

### 1.2 Vision Statement
To create an engaging, gamified experience that strengthens the connection between Muslims and their local masjids while building a comprehensive community-driven database of masjid information across Malaysia.

### 1.3 Target Market
- **Primary**: Muslims in Malaysia aged 18-45
- **Secondary**: Tourists and visitors interested in exploring Malaysian masjids
- **Geographic Scope**: Malaysia only (all 13 states + 3 federal territories)

---

## 2. Problem Statement

### 2.1 Current Challenges
1. Many Muslims only visit their local neighborhood masjid
2. Limited awareness of masjids in other areas
3. No centralized, community-maintained database of masjid facilities and information
4. Lack of engagement incentives for mosque visits beyond religious obligation
5. Lack of interest of young people to join masjid event

### 2.2 Solution
A gamified mobile app that rewards users for:
- Visiting different masjids across Malaysia
- Contributing information and photos
- Building a community around mosque engagement

---

## 3. Core Features

### 3.1 Check-in/Check-out System

#### 3.1.1 Check-in Requirements
- User must be within **100 meters** of the masjid's registered coordinates
- GPS location verification required
- User initiates check-in manually via app

#### 3.1.2 Check-out Requirements
- Minimum **5 minutes** must pass after check-in
- User must still be within **150 meters** of the masjid (slightly larger radius to account for GPS drift)
- User initiates check-out manually

#### 3.1.3 Visit Completion
- A visit is only "completed" when both check-in AND check-out conditions are met
- Incomplete visits (check-in without check-out) do not count toward achievements, but receive half of the points
- Users can view their "pending" visits

### 3.2 Points System

#### 3.2.1 Point Structure

| Action | Points | Notes |
|--------|--------|-------|
| Basic Visit | 10 | Completed check-in/check-out cycle |
| Photo Upload | 5 | Per approved photo (max 1 per visit, per person) |
| Facility Info Update | 15 | Per verified update |
| Donation | 20 | If they click donation link, we dont track if they actually donate or not |
| First Visitor Bonus | 25 | First user to visit a newly added masjid |
| Prayer Time Visit | 2x multiplier | Visit during Subuh, Zohor, Asar, Maghrib, or Isyak |

#### 3.2.2 Point Calculation Example
- Visit during Zohor prayer time: 10 × 2 = 20 points
- Upload 1 photos: 5 × 1 = 5 points
- Update facility info: 15 points
- **Total**: 45 points

#### 3.2.3 Anti-Abuse Measures
- Maximum 3 visits per day to the same masjid count for points
- 24-hour cooldown between point-earning visits to same masjid
- Photo/info submissions require admin approval
- GPS spoofing detection

### 3.3 Achievement System

#### 3.3.1 Explorer Achievements (Visit Count)

| Achievement | Requirement | Badge |
|-------------|-------------|-------|
| Pengembara Pemula | 3 masjids | Bronze |
| Pengembara Aktif | 5 masjids | Silver |
| Pengembara Dedikasi | 10 masjids | Gold |
| Pengembara Hebat | 20 masjids | Platinum |
| Pengembara Legenda | 50 masjids | Diamond |

#### 3.3.2 Geographic Achievements

| Achievement | Requirement |
|-------------|-------------|
| Penakluk Daerah | All masjids in a single district |
| Juara Negeri | All masjids in a single state |
| Wira Nasional | All masjids in Malaysia |

#### 3.3.3 Special Achievements

| Achievement | Requirement |
|-------------|-------------|
| Pahlawan Solat | Visited during all 5 prayer times (any masjid) |
| Pembina Komuniti | Top contributor in a state (monthly) |
| Dermawan | Made donations at 10 different masjids |
| Jurugambar Masjid | 10 approved photos uploaded |

### 3.4 Leaderboard System

#### 3.4.1 Leaderboard Categories
1. **Monthly Leaderboard** - Reset monthly for fresh competition
2. **All-Time Leaderboard** - Cumulative points

#### 3.4.2 Display Information
- Rank position
- Username (or anonymous option)
- Total points
- Number of masjids visited
- Top achievement badge

### 3.5 Contribution Features

#### 3.5.1 Photo Sharing
- Users can upload photos during or after visit
- Categories: Exterior, Interior, Wudhu area, Parking, Facilities
- Photos require moderation before publishing
- Guidelines for appropriate content
- Users only get points after the photo is approved

#### 3.5.2 Facility Information Updates
Users can update/add:
- Prayer times (auto-fetch where available)
- Available facilities (parking, wudhu area, air-con, etc.)
- Accessibility features
- Contact information
- Special events/programs

#### 3.5.3 Donation Feature
- Link to masjid's official donation channels

---

## 4. User Journeys

### 4.1 New User Onboarding
1. Download app from App Store/Play Store
2. Create account (google oauth)
3. Grant location permissions
4. Complete tutorial (mock check-in)
5. View list of masjids near me in 10KM radius (no map)
6. Begin exploring

### 4.2 Standard Visit Flow
1. User travels to masjid
2. Open app, view masjid on map
3. Tap "Check In" when within range
4. App verifies location, confirms check-in
5. Timer starts (5 min minimum)
6. User performs prayers/activities
7. Tap "Check Out" when ready to leave
8. App verifies location and time
9. Visit completed, points awarded
10. Optional: Upload photos, update info

### 4.3 First-Time Masjid Visit
1. User arrives at masjid not in database
2. Option to "Add New Masjid"
3. User provides: Name, coordinates (auto), photos
4. Submission reviewed by admin
5. If approved: User receives First Visitor bonus
6. Masjid added to map for all users

---

## 5. Geographic Scope

### 5.1 States Covered (16 total)
1. Johor
2. Kedah
3. Kelantan
4. Melaka
5. Negeri Sembilan
6. Pahang
7. Perak
8. Perlis
9. Pulau Pinang
10. Sabah
11. Sarawak
12. Selangor
13. Terengganu
14. Kuala Lumpur (FT)
15. Labuan (FT)
16. Putrajaya (FT)

### 5.2 Districts
- All districts within each state
- Approximately 160+ districts total
- District boundaries based on official JUPEM data

### 5.3 Masjid Data Sources
- JAKIM (Jabatan Kemajuan Islam Malaysia) database
- Community submissions (verified)
- Estimated 2,000+ masjids nationwide

---

## 6. Non-Functional Requirements

### 6.1 Performance
- App launch: < 3 seconds
- Check-in processing: < 1 second
- Support 1,000 concurrent users

### 6.2 Availability
- 99.5% uptime SLA
- Offline mode for viewing saved masjids
- Graceful degradation during connectivity issues

### 6.3 Security
- End-to-end encryption for user data
- PDPA (Malaysia) compliance
- GPS spoofing detection
- Rate limiting on API calls

### 6.4 Localization
- Primary: Bahasa Malaysia
- Secondary: English
- Prayer time calculations based on local authority (JAKIM)

---

## 7. Success Metrics

### 7.1 Key Performance Indicators (KPIs)

| Metric | Target (Year 1) |
|--------|-----------------|
| Total Downloads | 1000 |
| Monthly Active Users | 100 |
| Total Check-ins | 500 |
| Unique Masjids Visited | 500 |
| User-Contributed Photos | 100 |
| Average Session Duration | 10 minutes |

### 7.2 Engagement Metrics
- Daily Active Users (DAU)
- Check-ins per user per month
- Achievement completion rate
- Contribution rate (photos/info updates)
- Retention rate (D1, D7, D30)

---

## 8. Future Considerations (Post-MVP)

### 8.1 Potential Features
- Social features (friends, groups)
- Masjid events calendar
- Integration with e-donation platforms
- Ramadan special events/challenges
- Qurban/Korban tracking
- Community chat per masjid
- Join event masjid to receive point multiplier

### 8.2 Expansion
- Surau (prayer rooms) inclusion
- Expansion to other countries (Indonesia, Brunei, Singapore)

### 8.3 Monetization 
- monthly fee for masjid committee to held event to provide points to users
- premium feature

---

## 9. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| GPS spoofing | High | Multi-factor location verification |
| Inappropriate content | Medium | Moderation system, community reporting |
| Battery drain | Medium | Optimize location services |
| Data accuracy | High | Verification system, official data sources |
| Low adoption | High | Marketing, gamification, word-of-mouth |

---

## 10. Glossary

| Term | Definition |
|------|------------|
| Masjid | Mosque (place of worship for Muslims) |
| Solat | Prayer (5 daily prayers in Islam) |
| Subuh | Dawn prayer |
| Zohor | Midday prayer |
| Asar | Afternoon prayer |
| Maghrib | Sunset prayer |
| Isyak | Night prayer |
| Wudhu | Ablution (ritual washing before prayer) |
| JAKIM | Department of Islamic Development Malaysia |
| Daerah | District |
| Negeri | State |

---

## Appendix A: Wireframe References

*To be added during design phase*

## Appendix B: Competitive Analysis

| App | Region | Key Difference |
|-----|--------|----------------|
| Muslim Pro | Global | Prayer times focus, no gamification |
| Salam Planet | Global | Social network focus |
| HalalTrip | Global | Travel/tourism focus |

**Masjid Go Differentiator**: Location-based gamification specifically for masjid visits in Malaysia.
