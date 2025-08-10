# DharmaSaathi Expo React Native WebView App - Complete Implementation Plan

## 📱 Project Overview

This plan outlines the creation of a React Native Expo WebView mobile app for the DharmaSaathi dating platform, with seamless integration of push notifications for iOS and Android.

## 🎯 Key Features & Requirements

### Core Features
1. **WebView Integration**: Display the web app (https://dhrmsthiwebview.vercel.app/) within native mobile app
2. **Push Notifications** for:
   - New messages received
   - New likes received (with "Someone liked you" message)  
   - Superlikes received
   - New matches
   - Daily reminders (optional)
   - Profile views (if implemented)
   
3. **Native Navigation Header**: Custom native header with notifications badge
4. **Deep Linking**: Navigate to specific pages when notification is tapped
5. **Offline Support**: Show appropriate message when offline
6. **Biometric Authentication**: Optional Face ID/Touch ID integration
7. **App Store Compliance**: Meet iOS and Android store requirements

## 🏗️ Technical Architecture

### Tech Stack
- **Framework**: Expo SDK 50+ (managed workflow)
- **Language**: TypeScript
- **Push Notifications**: Expo Push Notifications + Firebase Cloud Messaging (FCM)
- **WebView**: react-native-webview
- **State Management**: Zustand or Context API
- **Navigation**: expo-router
- **Analytics**: Expo Analytics + Firebase Analytics
- **Backend Integration**: Supabase (existing) + Push notification server

### Architecture Components
```
┌─────────────────────────────────────────────────────────────┐
│                     Expo React Native App                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   App Router    │  │  WebView     │  │ Push Service  │  │
│  │  (expo-router)  │  │  Container   │  │   Handler     │  │
│  └────────┬────────┘  └──────┬───────┘  └───────┬───────┘  │
│           │                   │                   │          │
│  ┌────────▼────────┐  ┌──────▼───────┐  ┌───────▼───────┐  │
│  │  Native Header  │  │   Bridge     │  │   FCM/APNs    │  │
│  │  & Navigation   │  │  Handler     │  │  Integration  │  │
│  └─────────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                      ┌────────▼────────┐
                      │   Supabase +    │
                      │ Notification DB │
                      └─────────────────┘
```

## 📋 Implementation Phases

### Phase 1: Project Setup & Basic WebView (Week 1)
1. **Initialize Expo Project**
   ```bash
   npx create-expo-app dharmasaathi-app --template expo-template-blank-typescript
   cd dharmasaathi-app
   ```

2. **Install Dependencies**
   ```bash
   npx expo install react-native-webview expo-notifications expo-device expo-constants
   npx expo install expo-secure-store expo-splash-screen expo-status-bar
   npx expo install expo-router expo-linking expo-updates
   ```

3. **Basic WebView Implementation**
   - Create WebView container component
   - Handle navigation (back/forward)
   - Implement loading states
   - Handle errors and offline mode

4. **Native Header Implementation**
   - Custom header with app logo
   - Notification bell with badge count
   - Profile avatar (from WebView data)

### Phase 2: Push Notification Infrastructure (Week 2)
1. **Backend Setup**
   - Create notifications table in Supabase
   - Add push_token field to users table
   - Create notification trigger functions
   - Set up notification queue system

2. **Expo Push Notification Setup**
   - Configure push credentials for iOS (APNs)
   - Configure push credentials for Android (FCM)
   - Implement token registration flow
   - Handle notification permissions

3. **Notification Handlers**
   - Background notification handler
   - Foreground notification handler
   - Notification tap handler with deep linking

### Phase 3: WebView-Native Bridge (Week 3)
1. **JavaScript Bridge Implementation**
   - Create communication protocol between WebView and native
   - Pass user authentication data
   - Handle notification registration
   - Sync notification preferences

2. **Deep Linking Setup**
   - Configure URL schemes
   - Handle notification tap navigation
   - Navigate to specific pages (messages, likes, matches)

3. **State Synchronization**
   - Sync authentication state
   - Update notification badges
   - Handle logout/login flows

### Phase 4: Enhanced Features (Week 4)
1. **Biometric Authentication**
   - Implement Face ID/Touch ID
   - Secure storage for credentials
   - Auto-login functionality

2. **Performance Optimization**
   - Implement caching strategies
   - Optimize WebView performance
   - Reduce app size

3. **Analytics Integration**
   - Track app events
   - Monitor push notification metrics
   - User engagement tracking

### Phase 5: Testing & Deployment (Week 5)
1. **Testing**
   - Unit tests for native components
   - Integration tests for notifications
   - E2E testing with Detox
   - Beta testing with TestFlight/Google Play Console

2. **App Store Preparation**
   - App icons and splash screens
   - App Store screenshots
   - Privacy policy updates
   - App descriptions

3. **Deployment**
   - Build production apps
   - Submit to App Store
   - Submit to Google Play Store

## 📁 Project Structure
```
dharmasaathi-app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx         # WebView container
│   │   └── notifications.tsx # Notification center
│   ├── _layout.tsx           # Root layout
│   └── +not-found.tsx
├── components/
│   ├── WebViewContainer.tsx
│   ├── NativeHeader.tsx
│   ├── NotificationBadge.tsx
│   ├── OfflineView.tsx
│   └── LoadingView.tsx
├── services/
│   ├── notifications.ts
│   ├── webviewBridge.ts
│   ├── deepLinking.ts
│   └── analytics.ts
├── hooks/
│   ├── useNotifications.ts
│   ├── useWebViewBridge.ts
│   └── useAppState.ts
├── constants/
│   ├── config.ts
│   └── types.ts
├── assets/
│   ├── icons/
│   ├── images/
│   └── splash/
├── app.json
├── app.config.ts
├── package.json
└── tsconfig.json
```

## 🎨 Assets Required

### App Icons
1. **iOS Icons** (multiple sizes):
   - 1024x1024 (App Store)
   - 180x180 (iPhone)
   - 167x167 (iPad Pro)
   - 152x152 (iPad)
   - 120x120 (iPhone)
   - And other required sizes

2. **Android Icons**:
   - 512x512 (Google Play)
   - Adaptive icon layers (foreground/background)
   - Round icons
   - Legacy icons

### Splash Screens
1. **iOS Splash**:
   - 2732x2732 (iPad Pro 12.9")
   - 2048x2048 (iPad Pro 11")
   - 1242x2688 (iPhone 14 Pro Max)
   - Other device sizes

2. **Android Splash**:
   - xxxhdpi: 1280x1920
   - xxhdpi: 960x1440
   - xhdpi: 640x960
   - hdpi: 480x720

### Marketing Assets
1. **App Store Screenshots** (5-10 per device type):
   - 6.7" (iPhone 14 Pro Max): 1290x2796
   - 6.5" (iPhone 14 Plus): 1242x2688
   - 5.5" (iPhone 8 Plus): 1242x2208
   - iPad Pro 12.9": 2048x2732

2. **Google Play Screenshots** (2-8 images):
   - Phone: 1080x1920 minimum
   - Tablet: 1200x1920 minimum

3. **Feature Graphics**:
   - Google Play: 1024x500

4. **Promotional Images**:
   - App Store preview video (optional)
   - Google Play promo video (optional)

### Notification Icons
1. **iOS**: Uses app icon automatically
2. **Android**: 
   - Small icon (monochrome): 24x24, 48x48, 96x96
   - Large icon (optional): 256x256

### Additional Graphics
1. **In-app assets**:
   - Loading animations/Lottie files
   - Error state illustrations
   - Empty state illustrations
   - Offline mode illustration

2. **Brand Assets**:
   - Logo variations (light/dark)
   - Brand colors
   - Typography guidelines

## 🔧 Backend Requirements

### Supabase Schema Updates
```sql
-- Add push notification fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "messages": true,
  "likes": true,
  "superlikes": true,
  "matches": true,
  "daily_reminders": false
}'::jsonb;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'message', 'like', 'superlike', 'match'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification queue for reliable delivery
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  retry_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Edge Functions Required
1. **register-push-token**: Store user's push token
2. **send-notification**: Queue and send push notifications
3. **notification-worker**: Process notification queue
4. **update-notification-preferences**: Update user preferences

## 🚀 Development Commands

```bash
# Development
npx expo start

# Build for iOS
eas build --platform ios

# Build for Android  
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android

# OTA Updates
eas update --branch production
```

## 🎯 Success Metrics

1. **Technical Metrics**:
   - App crash rate < 1%
   - Push notification delivery rate > 95%
   - App load time < 3 seconds
   - WebView performance score > 90

2. **User Engagement**:
   - Push notification opt-in rate > 70%
   - Daily active users increase by 40%
   - Message response rate improvement
   - Retention rate improvement

3. **Business Metrics**:
   - App store rating > 4.5 stars
   - Reduced web-to-app friction
   - Increased premium conversions
   - Lower user acquisition cost

## 🛡️ Security Considerations

1. **Authentication**:
   - Secure token storage
   - Biometric authentication
   - Session management
   - Auto-logout on app backgrounding

2. **Data Protection**:
   - Encrypted storage for sensitive data
   - Secure WebView configuration
   - Certificate pinning
   - Prevent screenshot in sensitive areas

3. **Privacy**:
   - Clear privacy policy
   - GDPR compliance
   - Data deletion options
   - Notification permission handling

## 📚 Resources & Documentation

1. **Expo Documentation**: https://docs.expo.dev/
2. **React Native WebView**: https://github.com/react-native-webview/react-native-webview
3. **Expo Notifications**: https://docs.expo.dev/versions/latest/sdk/notifications/
4. **Apple Push Notification Service**: https://developer.apple.com/documentation/usernotifications
5. **Firebase Cloud Messaging**: https://firebase.google.com/docs/cloud-messaging
6. **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
7. **Google Play Guidelines**: https://play.google.com/console/about/

## 🎉 Conclusion

This comprehensive plan provides a roadmap for creating a high-quality, native mobile app experience while leveraging your existing web application. The WebView approach allows for rapid deployment while push notifications ensure user engagement remains high. With proper implementation, users will have a seamless experience that feels completely native.
