# DharmaSaathi Mobile App

A React Native WebView wrapper for the DharmaSaathi dating/matrimonial platform, built with Expo.

## 🚀 Features

- **WebView Integration**: Seamlessly displays the DharmaSaathi web application
- **Native Camera**: Take photos and upload from gallery for profile pictures
- **Push Notifications**: Local and push notification support
- **Deep Linking**: Handle profile sharing and direct navigation
- **Security**: Restricted domain access and secure WebView configuration
- **Cross-Platform**: Works on both iOS and Android

## 📱 Tech Stack

- **Expo SDK 52+** - React Native development platform
- **TypeScript** - Type-safe development
- **react-native-webview** - WebView component
- **expo-notifications** - Push notifications
- **expo-camera** & **expo-image-picker** - Camera and gallery access
- **expo-linking** - Deep linking support

## 🛠 Installation

1. **Clone the repository**
   ```bash
   cd dharmasaathi-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure app settings**
   - Update `app.json` with your bundle identifiers
   - Set your domain URLs in the services
   - Configure push notification settings

## 🚀 Development

### Start the development server
```bash
npm run start
```

### Run on specific platforms
```bash
# iOS Simulator
npm run ios

# Android Emulator  
npm run android

# Web browser (for testing)
npm run web
```

## 📁 Project Structure

```
├── src/
│   └── services/
│       ├── WebViewService.ts    # WebView integration and messaging
│       ├── CameraService.ts     # Camera and image picker functionality
│       ├── NotificationService.ts # Push notifications
│       └── LinkingService.ts    # Deep linking and URL handling
├── App.tsx                      # Main application component
├── app.json                     # Expo configuration
└── package.json                 # Dependencies and scripts
```

## 🔧 Configuration

### WebView Security
The app is configured to only allow specific domains:
- `dharmasaathi.com` and `www.dharmasaathi.com`
- Payment domains (Razorpay)

### Deep Linking
Supports the following URL schemes:
- `https://dharmasaathi.com/*`
- `dharmasaathi://` (custom scheme)

### Permissions
The app requests the following permissions:
- **Camera**: For profile photo uploads
- **Photo Library**: For selecting existing photos
- **Notifications**: For match alerts and messages

## 🌉 Native Bridge

The app provides a JavaScript bridge (`window.NativeBridge`) with these methods:

```javascript
// Camera functionality
window.NativeBridge.openCamera(options)
window.NativeBridge.openImagePicker(options)

// Notifications
window.NativeBridge.sendNotification(title, body, data)

// Sharing
window.NativeBridge.share(subject, body)

// Device info
window.NativeBridge.getDeviceInfo()
```

## 📱 Building for Production

### iOS
1. Configure bundle identifier in `app.json`
2. Set up Apple Developer account
3. Build with EAS:
   ```bash
   npx eas build --platform ios
   ```

### Android
1. Configure package name in `app.json`
2. Set up Google Play Console
3. Build with EAS:
   ```bash
   npx eas build --platform android
   ```

## 🧪 Testing

### Run on physical devices
```bash
# Install Expo Go app on your device
# Scan QR code from npm run start
```

### Test specific features
- Camera functionality on physical devices
- Push notifications
- Deep linking from other apps
- Payment flows

## 🔍 Debugging

### WebView Debugging
- Enable remote debugging in Chrome DevTools
- Use `console.log` in injected JavaScript
- Monitor network requests in WebView

### React Native Debugging
- Use Flipper for iOS/Android debugging
- Enable network inspector
- Monitor performance

## 📋 TODO

- [ ] Implement offline mode handling
- [ ] Add biometric authentication
- [ ] Enhance push notification rich content
- [ ] Add analytics tracking
- [ ] Implement app update notifications
- [ ] Add crash reporting

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, contact the DharmaSaathi development team or create an issue in this repository.

---

**Note**: This is a WebView wrapper app. Most functionality is handled by the web application at dharmasaathi.com. This native app provides the bridge between web features and native mobile capabilities.
