# DharmaSaathi Expo App - Quick Start Development Guide

## 🚀 Day 1: Get Started Immediately

### Step 1: Initialize Project (30 minutes)
```bash
# Create the Expo app
npx create-expo-app dharmasaathi-mobile --template expo-template-blank-typescript
cd dharmasaathi-mobile

# Install essential dependencies
npx expo install react-native-webview expo-notifications expo-device expo-constants
npx expo install expo-secure-store expo-splash-screen expo-status-bar expo-router
npx expo install @react-native-async-storage/async-storage expo-linking
npm install zustand

# Install dev dependencies
npm install -D @types/react @types/react-native prettier eslint
```

### Step 2: Create Basic Project Structure (20 minutes)
```bash
# Create folder structure
mkdir -p app/(tabs) components services hooks stores constants assets/icons assets/images
touch app/_layout.tsx app/(tabs)/_layout.tsx app/(tabs)/index.tsx
touch components/WebViewContainer.tsx services/notifications.ts
touch hooks/useWebViewBridge.ts stores/authStore.ts constants/config.ts
```

### Step 3: Basic Configuration Files

#### app.json
```json
{
  "expo": {
    "name": "DharmaSaathi",
    "slug": "dharmasaathi-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#8B5CF6"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.dharmasaathi.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#8B5CF6"
      },
      "package": "com.dharmasaathi.app"
    },
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    },
    "scheme": "dharmasaathi"
  }
}
```

#### constants/config.ts
```typescript
export const config = {
  webUrl: 'https://dhrmsthiwebview.vercel.app',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  colors: {
    primary: '#8B5CF6',
    primaryDark: '#7C3AED',
    primaryLight: '#A78BFA',
    secondary: '#EC4899',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F97316',
  }
};
```

### Step 4: Minimal Working WebView (1 hour)

#### app/_layout.tsx
```typescript
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

#### app/(tabs)/index.tsx
```typescript
import { useState } from 'react';
import { View, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import WebView from 'react-native-webview';
import { config } from '@/constants/config';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ 
        height: 60, 
        backgroundColor: config.colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          DharmaSaathi
        </Text>
      </View>
      
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: config.webUrl }}
          style={{ flex: 1 }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
        />
        
        {loading && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}>
            <ActivityIndicator size="large" color={config.colors.primary} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
```

### Step 5: Run the App (10 minutes)
```bash
# Start the development server
npx expo start

# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code with Expo Go app on physical device
```

## 📱 Day 2-3: Core Features Implementation

### 1. Enhanced WebView with Bridge
```typescript
// hooks/useWebViewBridge.ts
import { useCallback } from 'react';
import { WebViewMessageEvent } from 'react-native-webview';

export function useWebViewBridge() {
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Message from web:', message);
      
      switch (message.type) {
        case 'AUTH_STATUS':
          // Handle auth status
          break;
        case 'NOTIFICATION_PERMISSION':
          // Request notification permission
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }, []);

  const injectedJavaScript = `
    window.isNativeApp = true;
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'NATIVE_APP_READY',
      platform: '${Platform.OS}'
    }));
    true;
  `;

  return { handleMessage, injectedJavaScript };
}
```

### 2. Basic Push Notifications
```typescript
// services/notifications.ts
import * as Notifications from 'expo-notifications';

export async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Permission not granted for notifications');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push token:', token);
  
  // TODO: Send token to your backend
  return token;
}
```

### 3. State Management Setup
```typescript
// stores/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: any | null;
  token: string | null;
  setAuth: (user: any, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
}));
```

## 🛠️ Day 4-5: Backend Integration

### 1. Supabase Push Notification Table
```sql
-- Run this in Supabase SQL editor
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Function to send push notification
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Get user's push token
  SELECT token INTO v_token
  FROM push_tokens
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_token IS NOT NULL THEN
    -- Call edge function to send notification
    -- This is a placeholder - implement actual sending logic
    RAISE NOTICE 'Sending notification to token: %', v_token;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### 2. Quick Edge Function for Notifications
```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'

serve(async (req) => {
  const { userId, title, body, data } = await req.json()
  
  // Get user's push token from database
  // Send to Expo Push Service
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  }
  
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })
  
  return new Response(JSON.stringify({ success: true }))
})
```

## 🎨 Day 6-7: Polish & Testing

### 1. Add Loading States
```typescript
// components/LoadingScreen.tsx
export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image source={require('@/assets/logo.png')} style={styles.logo} />
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}
```

### 2. Handle Offline State
```typescript
// components/OfflineScreen.tsx
import { useNetInfo } from '@react-native-community/netinfo';

export function OfflineScreen() {
  const netInfo = useNetInfo();
  
  if (netInfo.isConnected === false) {
    return (
      <View style={styles.container}>
        <Text>You're offline</Text>
        <Button title="Retry" onPress={() => {/* retry logic */}} />
      </View>
    );
  }
  
  return null;
}
```

### 3. Test Push Notifications
```bash
# Send test notification using Expo tool
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
  "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
  "title": "Test Notification",
  "body": "This is a test message",
  "data": { "type": "test" }
}'
```

## 📲 Quick Deployment (Development Build)

### 1. Create Development Build
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Create development build for iOS
eas build --platform ios --profile development

# Create development build for Android
eas build --platform android --profile development
```

### 2. Test on Real Devices
1. Download the build from Expo dashboard
2. Install on your device
3. Test all features:
   - WebView loading
   - Navigation
   - Push notifications
   - Deep linking

## 🚨 Common Issues & Solutions

### WebView Not Loading
```typescript
// Add error handling
<WebView
  source={{ uri: config.webUrl }}
  onError={(syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
  }}
  renderError={() => <ErrorScreen />}
/>
```

### Push Notifications Not Working
1. Check permissions are granted
2. Verify push token is valid
3. Test with Expo push notification tool
4. Check backend is saving tokens correctly

### iOS Specific Issues
```typescript
// Add iOS specific configs
ios: {
  infoPlist: {
    NSAppTransportSecurity: {
      NSAllowsArbitraryLoads: true
    }
  }
}
```

## 📚 Next Steps

1. **Implement Deep Linking**: Handle notification taps
2. **Add Biometric Auth**: Face ID/Touch ID
3. **Optimize Performance**: Cache, lazy loading
4. **Add Analytics**: Track user behavior
5. **Implement OTA Updates**: Use EAS Update

## 🔗 Useful Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Guide.md)
- [Expo Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)

## 💡 Pro Tips

1. **Start Simple**: Get basic WebView working first
2. **Test Early**: Use Expo Go for rapid testing
3. **Handle Errors**: Add error boundaries and fallbacks
4. **Monitor Performance**: Use React DevTools
5. **User Feedback**: Add loading and error states
6. **Incremental Features**: Add one feature at a time
7. **Real Device Testing**: Always test on actual devices

With this quick start guide, you can have a working WebView app with push notifications in just a week!
