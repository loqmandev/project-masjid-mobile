# Jejak Masjid Mobile

A gamified mobile app that encourages Muslims in Malaysia to visit masjids, check in, and earn points and achievements.

## Development

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npx expo start
```

Press `w` to open in web browser, `a` for Android emulator, or `i` for iOS simulator.

### Platform-Specific Commands

```bash
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
npm run lint       # Run ESLint
```

---

# Deployment Guide

This guide covers deploying **Jejak Masjid** to:
- **Google Play Store** (Internal Testing / Closed Testing)
- **Apple TestFlight** (Internal Testing / External Testing)

**Prerequisites:** You must be invited to the Google Play Console and App Store Connect as a team member before deploying.

---

## Initial Setup

### 1. Install EAS CLI

```bash
npm install --global eas-cli
```

### 2. Login to Expo Account

```bash
eas login
```

### 3. Configure Project

```bash
eas build:configure
```

This creates/updates `eas.json` with build profiles.

---

## Android Deployment

### Step 1: Get Google Service Account Key

**If the service account key already exists in the project, skip to Step 2.**

1. Ask the Ops team for the `google-service-account-key.json` file
2. Place it in the project root directory
3. Ensure it's in `.gitignore` (already done)

### Step 2: Configure Android Credentials

```bash
eas credentials --platform android
```

When prompted:
- Select `production` build profile
- Verify credentials are configured

### Step 3: Build and Submit

```bash
# Build and auto-submit in one command
eas build --platform android --profile production --auto-submit

# Or build first, then submit separately
eas build --platform android --profile production
eas submit --platform android --latest
```

### Step 4: Verify in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select **Jejak Masjid** app
3. Navigate to **Testing > Internal testing** (or **Closed testing**)
4. Your build should appear there

### Add Testers

1. In Play Console, go to **Testing > Internal testing**
2. Click **Create email list** or use existing list
3. Add tester emails
4. Share the opt-in URL with testers

---

## iOS Deployment

### Step 1: Find App Store Connect App ID

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select **Jejak Masjid** app
3. Click **App Store** tab
4. Go to **General > App Information** (left sidebar)
5. Copy the **Apple ID** number

### Step 2: Update `eas.json`

Add the `ascAppId` to `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "PASTE_YOUR_APPLE_ID_HERE"
      }
    }
  }
}
```

### Step 3: Configure iOS Credentials

```bash
eas credentials --platform ios
```

When prompted:
- Select `production` build profile
- Choose **App Store Connect: Manage your API Key** (recommended) or **App Specific Password**

**For App-specific Password:**
1. Go to https://appleid.apple.com
2. **Security > App-Specific Passwords > Generate Password**
3. Label it "EAS Submit" and copy the password
4. Use this password when prompted

### Step 4: Build and Submit

```bash
# Build and auto-submit in one command
eas build --platform ios --profile production --auto-submit

# Or build first, then submit separately
eas build --platform ios --profile production
eas submit --platform ios --latest
```

### Step 5: Verify in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select **Jejak Masjid** app
3. Click **TestFlight** tab
4. Your build should appear in **Internal Testing** (15-30 minutes after submission)

### Add Testers

1. In TestFlight, go to **Internal Testing**
2. Click **+** to add internal testers
3. Enter email addresses and click **Invite**

For **External Testing**:
1. Go to **TestFlight > External Testing**
2. Click **Create a group**
3. Add tester emails
4. Submit for external testing review (takes 24-48 hours for Apple review)

---

## Update Version Number

Before deploying a new release, update the version in `app.json`:

```json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

Or use EAS CLI:

```bash
eas build:version:set --platform all
```

---

## Common Commands

```bash
# List all builds
eas build:list

# View specific build details
eas build:view <BUILD_ID>

# Watch build progress
eas build --platform ios --profile production --wait

# Submit latest build
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## Project Configuration

| Configuration | Value |
|---------------|-------|
| App Name | Jejak Masjid |
| iOS Bundle Identifier | `my.lonasoft.jejakmasjidmobile` |
| Android Package | `my.lonasoft.jejakmasjidmobile` |
| EAS Project ID | `109eab53-81a4-4339-80ca-35191637d8d7` |
| Expo SDK | ~54.0.32 |

---

## Troubleshooting

**Build fails with "Invalid credentials"**
```bash
eas credentials --platform android  # or ios
```

**TestFlight build not appearing**
- Wait 15-30 minutes for processing
- Check EAS dashboard: https://expo.dev

**First Android deployment requires manual upload**
- If this is the very first Android deployment ever, you must upload manually via Play Console once
- After that, `eas submit` will work

---

## Resources

- [Expo EAS Documentation](https://docs.expo.dev/eas)
- [Submit to Google Play Store](https://docs.expo.dev/submit/android/)
- [Submit to Apple App Store](https://docs.expo.dev/submit/ios/)
