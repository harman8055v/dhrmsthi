# DharmaSaathi Mobile App - AI Agent Execution Guide

## 🤖 Agent Instructions for Implementing the Expo WebView App

This document provides specific instructions for AI agents (like GitHub Copilot, Claude, or ChatGPT) to execute the DharmaSaathi mobile app development plan efficiently.

## 📋 Pre-Execution Checklist

Before starting, ensure you have:
- [ ] Access to the project repository
- [ ] Read all planning documents:
  - `EXPO_WEBVIEW_APP_PLAN.md` - Overall strategy
  - `EXPO_IMPLEMENTATION_GUIDE.md` - Code examples
  - `ASSETS_REQUIREMENTS.md` - Visual assets needed
  - `QUICK_START_GUIDE.md` - Rapid development guide
- [ ] Node.js 16+ installed
- [ ] Expo CLI available (`npm install -g expo-cli`)
- [ ] iOS Simulator/Android Emulator ready

## 🎯 Agent Task Execution Order

### Phase 1: Project Initialization (Day 1)
**Objective**: Set up the basic Expo project with TypeScript and essential dependencies.

#### Task 1.1: Create Project Structure
```bash
# Commands to execute:
npx create-expo-app dharmasaathi-mobile --template expo-template-blank-typescript
cd dharmasaathi-mobile

# Install all dependencies from EXPO_IMPLEMENTATION_GUIDE.md
npx expo install react-native-webview expo-notifications expo-device expo-constants
npx expo install expo-secure-store expo-splash-screen expo-status-bar
npx expo install expo-router expo-linking expo-updates expo-web-browser
npx expo install @react-native-async-storage/async-storage
npx expo install expo-local-authentication expo-haptics
npm install zustand
npm install -D @types/react @types/react-native
```

#### Task 1.2: Create Folder Structure
```bash
# Create all required directories
mkdir -p app/(tabs) app/api
mkdir -p components/ui components/native
mkdir -p services hooks stores constants
mkdir -p assets/icons assets/images assets/sounds assets/animations
mkdir -p lib/supabase lib/utils
```

#### Task 1.3: Initialize Core Configuration Files
1. Copy `app.config.ts` from `EXPO_IMPLEMENTATION_GUIDE.md`
2. Create `constants/config.ts` with environment variables
3. Set up `.env.local` with Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://dhrmsthiwebview.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_WEB_URL=https://dhrmsthiwebview.vercel.app
   ```

### Phase 2: Core WebView Implementation (Day 2)
**Objective**: Implement a functional WebView with loading states and basic navigation.

#### Task 2.1: Implement Root Layout
Create `app/_layout.tsx`:
- Copy code from `EXPO_IMPLEMENTATION_GUIDE.md` Section 2
- Ensure splash screen handling is implemented
- Set up providers (Auth, Notification)

#### Task 2.2: Implement WebView Container
1. Create `components/WebViewContainer.tsx` (use full code from guide)
2. Create `app/(tabs)/index.tsx` with WebView implementation
3. Add loading and error states

#### Task 2.3: Test Basic WebView
```bash
# Run and verify:
npx expo start
# Test on both iOS and Android
# Verify website loads correctly
# Check loading states work
```

### Phase 3: Native Bridge & Communication (Day 3)
**Objective**: Establish bidirectional communication between WebView and native app.

#### Task 3.1: Implement WebView Bridge
1. Create `hooks/useWebViewBridge.ts` (copy from Section 5 of implementation guide)
2. Add message handlers for:
   - Authentication status
   - Push token exchange
   - Navigation requests
   - Haptic feedback

#### Task 3.2: Create Bridge Testing Interface
Create a test page in the web app or use console to test:
```javascript
// Test commands to run in WebView console:
window.nativeBridge.postMessage({ type: 'HAPTIC_FEEDBACK', payload: { type: 'light' } })
window.nativeBridge.requestNotificationPermission()
```

### Phase 4: Push Notifications Setup (Day 4)
**Objective**: Implement complete push notification system.

#### Task 4.1: Notification Service Implementation
1. Create `services/notifications.ts` (copy from Section 3 of guide)
2. Implement token registration
3. Set up notification handlers
4. Create notification channels (Android)

#### Task 4.2: Backend Integration
1. Update Supabase schema:
   ```sql
   -- Run all SQL from EXPO_WEBVIEW_APP_PLAN.md Backend Requirements section
   ```
2. Create edge functions:
   - `send-push-notification`
   - `register-push-token`
   - `notification-worker`

#### Task 4.3: Test Notifications
```bash
# Test using curl command from QUICK_START_GUIDE.md
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
  "to": "ExponentPushToken[YOUR_TOKEN]",
  "title": "Test Like",
  "body": "Someone liked your profile!",
  "data": { "type": "like" }
}'
```

### Phase 5: State Management & Auth (Day 5)
**Objective**: Implement Zustand stores and authentication flow.

#### Task 5.1: Create Stores
1. Create `stores/authStore.ts` (from Section 4 of guide)
2. Create `stores/notificationStore.ts`
3. Create `stores/appStore.ts` for general app state

#### Task 5.2: Implement Auth Provider
```typescript
// Create providers/AuthProvider.tsx
// Implement auto-login from secure storage
// Handle token refresh
// Sync with WebView auth state
```

### Phase 6: UI Components & Navigation (Day 6)
**Objective**: Create native UI components and navigation structure.

#### Task 6.1: Native Header Implementation
1. Create `components/NativeHeader.tsx` (from Section 7 of guide)
2. Add notification badge
3. Implement user avatar
4. Add navigation actions

#### Task 6.2: Implement Tab Navigation
1. Create `app/(tabs)/_layout.tsx` with tab configuration
2. Add icons for each tab
3. Implement notification badge on tab

#### Task 6.3: Create Essential Screens
```typescript
// Create these screens:
// app/(tabs)/notifications.tsx - Notification center
// app/notification-settings.tsx - Settings modal
// app/profile.tsx - Profile screen (if needed)
```

### Phase 7: Enhanced Features (Day 7-8)
**Objective**: Add polish and additional features.

#### Task 7.1: Offline Support
1. Create `components/OfflineView.tsx`
2. Implement `hooks/useNetworkState.ts`
3. Add offline detection to WebView container

#### Task 7.2: Biometric Authentication
```typescript
// Implement in services/biometric.ts
import * as LocalAuthentication from 'expo-local-authentication';
// Add Face ID/Touch ID support
```

#### Task 7.3: Deep Linking
1. Configure deep links in `app.config.ts`
2. Implement link handlers
3. Test with notification taps

### Phase 8: Assets Creation (Parallel Task)
**Objective**: Create or commission all required visual assets.

#### Task 8.1: Generate Placeholder Assets
```bash
# Use a script to generate placeholder assets:
# Create colored squares for all icon sizes
# Use brand color #8B5CF6
```

#### Task 8.2: Create Asset Generation Script
```javascript
// scripts/generate-assets.js
// Create a Node.js script to generate all required sizes
// Reference ASSETS_REQUIREMENTS.md for dimensions
```

### Phase 9: Testing & Quality Assurance (Day 9-10)
**Objective**: Comprehensive testing on real devices.

#### Task 9.1: Create Test Checklist
- [ ] WebView loads on all devices
- [ ] Push notifications work (iOS & Android)
- [ ] Deep linking from notifications
- [ ] Offline mode displays correctly
- [ ] Authentication persists
- [ ] All navigation works
- [ ] Performance is acceptable

#### Task 9.2: Device Testing Matrix
| Feature | iPhone 14 | iPhone SE | Android 13 | Android 10 |
|---------|-----------|-----------|------------|------------|
| WebView | ✓ | ✓ | ✓ | ✓ |
| Push    | ✓ | ✓ | ✓ | ✓ |
| Auth    | ✓ | ✓ | ✓ | ✓ |

### Phase 10: Build & Deployment Prep (Day 11-12)
**Objective**: Prepare for app store submission.

#### Task 10.1: EAS Build Configuration
```bash
# Initialize EAS
eas build:configure

# Create eas.json from EXPO_IMPLEMENTATION_GUIDE.md
```

#### Task 10.2: Create Builds
```bash
# Development builds
eas build --platform all --profile development

# Preview builds for testing
eas build --platform all --profile preview

# Production builds (when ready)
eas build --platform all --profile production
```

## 🔧 Agent-Specific Instructions

### For Code Generation:
1. **Always use TypeScript** - The project is TypeScript-first
2. **Follow the existing patterns** from the implementation guide
3. **Use functional components** with hooks
4. **Implement error boundaries** for all major components
5. **Add comprehensive logging** for debugging

### For File Creation:
1. **Check file paths carefully** - Use the exact structure provided
2. **Include all imports** at the top of files
3. **Export components properly** for use in other files
4. **Add TypeScript interfaces** for all props and state

### For Testing:
1. **Test incrementally** - Don't wait until the end
2. **Use real devices** when possible
3. **Test both platforms** equally
4. **Document any platform-specific issues**

### For Asset Creation:
1. **Use the exact dimensions** from ASSETS_REQUIREMENTS.md
2. **Maintain consistent styling** with brand colors
3. **Optimize all images** before adding to project
4. **Test assets on different screen densities**

## 📊 Progress Tracking

### Daily Standup Format
```markdown
## Day X Progress Report

### Completed:
- [ ] Task 1
- [ ] Task 2

### In Progress:
- [ ] Task 3

### Blockers:
- Issue 1: Description and proposed solution

### Next Steps:
- Tomorrow's primary focus
```

## 🚨 Common Pitfalls to Avoid

1. **Don't skip the WebView bridge setup** - It's crucial for all features
2. **Test push notifications early** - They often have platform-specific issues
3. **Don't hardcode URLs** - Use environment variables
4. **Remember to handle loading states** - Users need feedback
5. **Test on real devices** - Simulators don't show all issues

## 🛠️ Debugging Commands

### Useful Commands for Agents
```bash
# Clear cache and restart
npx expo start -c

# Check for type errors
npx tsc --noEmit

# Run on specific platform
npx expo run:ios
npx expo run:android

# Check bundle size
npx expo export --platform all --output-dir dist

# Validate app.json
npx expo config --type public

# Check for missing dependencies
npx expo-doctor
```

## 📚 Reference Priority

When implementing features, reference documents in this order:
1. **EXPO_IMPLEMENTATION_GUIDE.md** - For actual code
2. **QUICK_START_GUIDE.md** - For rapid solutions
3. **EXPO_WEBVIEW_APP_PLAN.md** - For architecture decisions
4. **ASSETS_REQUIREMENTS.md** - For visual specifications

## 🎯 Success Criteria

The implementation is successful when:
1. ✅ WebView loads the website seamlessly
2. ✅ Push notifications work on both platforms
3. ✅ Users can receive notifications for all events (messages, likes, matches)
4. ✅ Deep linking works from notifications
5. ✅ App feels native, not like a web wrapper
6. ✅ Performance is smooth (no janky scrolling)
7. ✅ Offline state is handled gracefully
8. ✅ Authentication persists between sessions
9. ✅ App is ready for store submission
10. ✅ All tests pass on real devices

## 🚀 Final Deployment Checklist

Before considering the project complete:
- [ ] All features implemented and tested
- [ ] Assets created and optimized
- [ ] App icons and splash screens in place
- [ ] Store listings prepared
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] App tested on multiple real devices
- [ ] Performance profiled and optimized
- [ ] Crash reporting configured
- [ ] Analytics implemented
- [ ] Push notification server tested at scale
- [ ] Backup and disaster recovery plan in place

## 💡 Pro Tips for AI Agents

1. **Read error messages carefully** - Expo errors are usually descriptive
2. **Use the Expo documentation** - It's comprehensive and up-to-date
3. **Test features in isolation** - Use Expo Snack for quick tests
4. **Keep the web app running** - You'll need it for WebView testing
5. **Use version control** - Commit after each successful phase
6. **Document decisions** - Future agents will thank you

This guide should enable any AI agent to successfully implement the DharmaSaathi mobile app by following the structured approach and referring to the detailed documentation provided.
