# DharmaSaathi Mobile App - Complete Assets Requirements

## 🎨 Visual Assets Checklist

### 1. App Icons

#### iOS App Icons (Required Sizes)
```
ios/
├── Icon-1024.png         # 1024x1024 - App Store
├── Icon-180.png          # 180x180 - iPhone App
├── Icon-167.png          # 167x167 - iPad Pro
├── Icon-152.png          # 152x152 - iPad App
├── Icon-120.png          # 120x120 - iPhone App (2x)
├── Icon-87.png           # 87x87 - iPhone Settings (3x)
├── Icon-80.png           # 80x80 - iPad Spotlight (2x)
├── Icon-76.png           # 76x76 - iPad App
├── Icon-60.png           # 60x60 - iPhone Notification (3x)
├── Icon-58.png           # 58x58 - iPhone Settings (2x)
├── Icon-40.png           # 40x40 - iPad Notification (2x)
├── Icon-29.png           # 29x29 - iPhone Settings
└── Icon-20.png           # 20x20 - iPad Notification
```

#### Android App Icons
```
android/
├── ic_launcher-512.png           # 512x512 - Google Play Store
├── ic_launcher-192.png           # 192x192 - xxxhdpi
├── ic_launcher-144.png           # 144x144 - xxhdpi
├── ic_launcher-96.png            # 96x96 - xhdpi
├── ic_launcher-72.png            # 72x72 - hdpi
├── ic_launcher-48.png            # 48x48 - mdpi
├── ic_launcher_round-512.png     # 512x512 - Round icon
├── ic_launcher_foreground.png    # 512x512 - Adaptive icon foreground
└── ic_launcher_background.png    # 512x512 - Adaptive icon background
```

### 2. Splash Screens

#### iOS Launch Screens
```
splash/
├── splash-2732x2732.png    # iPad Pro 12.9"
├── splash-2048x2732.png    # iPad Pro 12.9" (portrait)
├── splash-2048x2048.png    # iPad Pro 11"
├── splash-1668x2388.png    # iPad Pro 11" (portrait)
├── splash-1290x2796.png    # iPhone 14 Pro Max
├── splash-1179x2556.png    # iPhone 14 Pro
├── splash-1170x2532.png    # iPhone 13/12 Pro
├── splash-1125x2436.png    # iPhone X/XS/11 Pro
├── splash-1242x2688.png    # iPhone XS Max/11 Pro Max
├── splash-828x1792.png     # iPhone XR/11
├── splash-750x1334.png     # iPhone 8/7/6s
└── splash-640x1136.png     # iPhone SE
```

#### Android Splash Screens
```
android-splash/
├── drawable-xxxhdpi/splash.png    # 1280x1920
├── drawable-xxhdpi/splash.png     # 960x1440
├── drawable-xhdpi/splash.png      # 640x960
├── drawable-hdpi/splash.png       # 480x720
└── drawable-mdpi/splash.png       # 320x480
```

### 3. App Store Screenshots

#### iOS Screenshots (Required for Each Device Size)
```
screenshots/ios/
├── 6.7-inch/    # iPhone 14 Pro Max (1290x2796)
│   ├── 01-home.png
│   ├── 02-swipe.png
│   ├── 03-matches.png
│   ├── 04-messages.png
│   ├── 05-profile.png
│   └── 06-notifications.png
├── 6.5-inch/    # iPhone 14 Plus (1242x2688)
├── 5.5-inch/    # iPhone 8 Plus (1242x2208)
└── 12.9-inch/   # iPad Pro (2048x2732)
```

#### Android Screenshots
```
screenshots/android/
├── phone/       # 1080x1920 minimum
│   ├── 01-home.png
│   ├── 02-swipe.png
│   ├── 03-matches.png
│   ├── 04-messages.png
│   ├── 05-profile.png
│   ├── 06-notifications.png
│   └── 07-feature.png
└── tablet/      # 1200x1920 minimum
```

### 4. Marketing Graphics

#### Google Play Store
```
marketing/android/
├── feature-graphic.png       # 1024x500 - Feature graphic (required)
├── promo-graphic.png        # 180x120 - Promo graphic (optional)
├── tv-banner.png            # 1280x720 - TV banner (optional)
└── wear-screenshot.png      # 384x384 - Wear OS (if applicable)
```

#### Social Media Assets
```
marketing/social/
├── facebook-cover.png       # 1200x630
├── twitter-header.png       # 1500x500
├── instagram-post.png       # 1080x1080
├── linkedin-banner.png      # 1584x396
└── youtube-thumbnail.png    # 1280x720
```

### 5. In-App Graphics

#### Navigation & UI Icons
```
assets/icons/
├── home.svg              # Tab bar icon
├── home-active.svg       # Active state
├── heart.svg             # Likes icon
├── heart-active.svg      
├── chat.svg              # Messages icon
├── chat-active.svg
├── user.svg              # Profile icon
├── user-active.svg
├── bell.svg              # Notifications
├── bell-active.svg
├── settings.svg          # Settings
├── logout.svg            # Logout
├── back.svg              # Back navigation
├── close.svg             # Close/dismiss
├── check.svg             # Success/check
├── info.svg              # Information
├── warning.svg           # Warning
├── error.svg             # Error
├── refresh.svg           # Refresh/reload
├── share.svg             # Share
├── filter.svg            # Filter
├── search.svg            # Search
├── camera.svg            # Camera
├── gallery.svg           # Photo gallery
├── location.svg          # Location
├── verified.svg          # Verified badge
├── premium.svg           # Premium badge
├── superlike.svg         # Superlike icon
├── boost.svg             # Boost icon
└── rewind.svg            # Rewind icon
```

#### Illustrations
```
assets/illustrations/
├── onboarding-1.svg      # Welcome illustration
├── onboarding-2.svg      # Features illustration
├── onboarding-3.svg      # Get started illustration
├── empty-matches.svg     # No matches state
├── empty-messages.svg    # No messages state
├── empty-likes.svg       # No likes state
├── offline.svg           # Offline state
├── error-404.svg         # Not found
├── error-500.svg         # Server error
├── success.svg           # Success state
├── celebration.svg       # Match celebration
├── loading.json          # Lottie animation
└── heart-animation.json  # Like animation
```

#### Brand Assets
```
assets/brand/
├── logo.svg              # Main logo
├── logo-white.svg        # White version
├── logo-dark.svg         # Dark version
├── logo-icon.svg         # Icon only
├── wordmark.svg          # Text only
└── tagline.svg           # Tagline
```

### 6. Notification Assets

#### iOS Push Notification Icons
- Uses app icon automatically
- No additional assets needed

#### Android Notification Icons
```
android/notification/
├── ic_notification.png       # 24x24 (mdpi)
├── ic_notification.png       # 36x36 (hdpi)
├── ic_notification.png       # 48x48 (xhdpi)
├── ic_notification.png       # 72x72 (xxhdpi)
├── ic_notification.png       # 96x96 (xxxhdpi)
└── ic_notification_large.png # 256x256 (large icon)
```

**Note**: Android notification icons must be white with transparent background

### 7. Sound Assets
```
assets/sounds/
├── notification.wav      # Default notification sound
├── message.wav          # New message sound
├── match.wav            # Match celebration sound
├── like.wav             # Like received sound
├── superlike.wav        # Superlike sound
└── error.wav            # Error sound
```

## 📋 Asset Specifications

### Design Guidelines

#### Color Palette
```
Primary Colors:
- Purple: #8B5CF6
- Purple Dark: #7C3AED
- Purple Light: #A78BFA

Secondary Colors:
- Pink: #EC4899
- Blue: #3B82F6
- Green: #10B981
- Orange: #F97316
- Red: #EF4444

Neutral Colors:
- Black: #000000
- Gray 900: #111827
- Gray 700: #374151
- Gray 500: #6B7280
- Gray 300: #D1D5DB
- Gray 100: #F3F4F6
- White: #FFFFFF
```

#### Typography
```
Fonts:
- Primary: System Font (SF Pro Display on iOS, Roboto on Android)
- Secondary: Inter or similar
- Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
```

#### Icon Guidelines
- Style: Outlined or filled, consistent throughout
- Stroke width: 2px for outlined icons
- Corner radius: 2px for rounded corners
- Padding: 10% minimum padding within icon bounds
- Format: SVG for in-app, PNG for system icons

### File Formats & Optimization

#### Images
- **Format**: PNG for icons, JPG for photos
- **Compression**: Optimize all images (use tools like TinyPNG)
- **Resolution**: @1x, @2x, @3x for iOS; mdpi to xxxhdpi for Android

#### Icons
- **Format**: SVG for scalable icons, PNG for raster
- **Size**: Design at 24x24 base size
- **Color**: Single color for easy theming

#### Animations
- **Format**: Lottie JSON for complex animations
- **Size**: Keep under 100KB per animation
- **Frame rate**: 30fps or 60fps

## 🚀 Asset Creation Tools

### Recommended Tools
1. **Design**: Figma, Sketch, Adobe XD
2. **Icons**: Figma, Illustrator, Icons8
3. **Animations**: After Effects + Lottie
4. **Image Optimization**: TinyPNG, ImageOptim
5. **Screenshot Creation**: Figma, Rotato, AppLaunchpad
6. **Icon Generation**: 
   - iOS: Bakery or Icon Set Creator
   - Android: Android Asset Studio

### Asset Generation Commands

#### Generate App Icons with Expo
```bash
# Install sharp-cli
npm install -g sharp-cli

# Generate iOS icons from 1024x1024 source
npx expo-optimize

# Or use icon generation tools
npx create-expo-app --template with-icons
```

#### Generate Splash Screens
```bash
# Configure in app.json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#8B5CF6"
    }
  }
}

# Then run
npx expo prebuild
```

## 📱 Asset Implementation

### Implementing Icons in Code
```typescript
// Using custom icons
import HomeIcon from '@/assets/icons/home.svg';
import HeartIcon from '@/assets/icons/heart.svg';

// Using vector icons
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
```

### Implementing Splash Screen
```typescript
// app/_layout.tsx
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// Hide splash when ready
useEffect(() => {
  if (fontsLoaded && authChecked) {
    SplashScreen.hideAsync();
  }
}, [fontsLoaded, authChecked]);
```

### Implementing Lottie Animations
```typescript
import LottieView from 'lottie-react-native';

<LottieView
  source={require('@/assets/animations/loading.json')}
  autoPlay
  loop
  style={{ width: 200, height: 200 }}
/>
```

## ✅ Pre-Launch Checklist

### Essential Assets (Must Have)
- [ ] App icon (all required sizes)
- [ ] Splash screen (all device sizes)
- [ ] At least 2 screenshots per device type
- [ ] Feature graphic (Android)
- [ ] Basic UI icons
- [ ] Logo variations
- [ ] Offline/error illustrations

### Nice to Have
- [ ] Animated splash screen
- [ ] Onboarding illustrations
- [ ] Custom notification sounds
- [ ] Lottie animations
- [ ] Social media assets
- [ ] App preview video

### Asset Validation
- [ ] All icons have correct dimensions
- [ ] Images are optimized (<100KB each)
- [ ] Colors match brand guidelines
- [ ] Assets work in light/dark mode
- [ ] Tested on various screen sizes
- [ ] Copyright-free or licensed properly
- [ ] Consistent visual style

## 🎯 Estimated Timeline

### Asset Creation Timeline
- **Week 1**: Brand assets, logos, color palette
- **Week 2**: App icons, splash screens
- **Week 3**: UI icons, illustrations
- **Week 4**: Screenshots, marketing materials
- **Week 5**: Animations, final optimization

### Budget Considerations
- **Design Services**: $2,000-5,000 for complete set
- **Stock Illustrations**: $200-500
- **Icon Packs**: $50-200
- **Animation Creation**: $500-1,500
- **Screenshot Tools**: $20-50/month

This comprehensive asset list ensures your DharmaSaathi mobile app will have a professional, polished appearance that maintains consistency with your brand while meeting all platform requirements.
