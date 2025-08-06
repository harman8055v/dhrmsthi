# Development Environment Setup

## Prerequisites

1. **Node.js** (v18 or later)
2. **npm** or **yarn**
3. **Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run start
   ```

3. **Run on device/simulator**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator

## Environment Variables

Create a `.env` file with:
```
EXPO_PROJECT_ID=your-expo-project-id
WEB_APP_URL=https://dharmasaathi.com
```

## Testing on Physical Devices

### iOS
1. Install **Expo Go** from App Store
2. Scan QR code from terminal
3. Test camera and notifications

### Android
1. Install **Expo Go** from Google Play
2. Scan QR code from terminal
3. Test camera and notifications

## Troubleshooting

### Common Issues

1. **Metro bundler cache issues**
   ```bash
   npm run start -- --clear
   ```

2. **WebView not loading**
   - Check internet connection
   - Verify domain whitelist in WebViewService

3. **Camera permissions**
   - Test on physical device (not simulator)
   - Check app permissions in device settings

4. **Push notifications not working**
   - Test on physical device
   - Check notification permissions

### Development Tips

- Use Chrome DevTools for WebView debugging
- Enable network inspector in Expo Dev Tools
- Test deep linking with custom URLs
- Monitor console logs for bridge messages
