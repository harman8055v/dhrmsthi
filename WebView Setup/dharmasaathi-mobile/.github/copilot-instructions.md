# DharmaSaathi Mobile App - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is an Expo React Native WebView wrapper app for DharmaSaathi, a dating/matrimonial platform. The app primarily uses WebView to display the web application while integrating native mobile features.

## Key Technologies
- **Expo SDK 52+** - React Native framework
- **TypeScript** - Type-safe development
- **react-native-webview** - WebView component for displaying web content
- **expo-linking** - Deep linking support
- **expo-notifications** - Push notifications
- **expo-camera** - Camera integration
- **expo-image-picker** - File upload handling

## Architecture
- **WebView-first approach**: Most UI and business logic runs in the web app
- **Native bridges**: For camera, notifications, file uploads, and deep linking
- **Hybrid navigation**: WebView handles internal navigation, native handles external actions

## Development Guidelines

### WebView Security
- Always validate URLs before loading
- Use allowlisted domains for security
- Implement proper error handling for network failures
- Handle loading states gracefully

### Native Integration
- Use message passing between WebView and React Native
- Implement native fallbacks for critical features
- Handle permission requests properly
- Test camera and file upload flows thoroughly

### Performance
- Optimize WebView loading with proper caching
- Use native loading indicators
- Handle offline states
- Implement proper memory management

### Deep Linking
- Support profile sharing URLs
- Handle authentication redirects
- Implement universal links for iOS
- Configure intent filters for Android

### Push Notifications
- Integrate with existing web push system
- Handle notification routing to correct screens
- Implement proper notification permissions
- Support rich notifications with images

## Code Style
- Use TypeScript strictly
- Follow Expo development best practices
- Implement proper error boundaries
- Use consistent naming conventions
- Add proper documentation for native bridges

## Testing
- Test WebView functionality on both platforms
- Verify camera and file upload flows
- Test deep linking scenarios
- Validate push notification delivery
- Test offline and error states

## Deployment
- Configure proper app icons and splash screens
- Set up proper bundle identifiers
- Test on physical devices
- Validate app store requirements
- Implement proper analytics tracking
