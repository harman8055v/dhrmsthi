# DharmaSaathi Expo WebView - Implementation Code Guide

## 1. Initial Project Setup

### Create and Configure Expo Project
```bash
# Create the project
npx create-expo-app dharmasaathi-app --template expo-template-blank-typescript
cd dharmasaathi-app

# Install all required dependencies
npx expo install react-native-webview expo-notifications expo-device expo-constants
npx expo install expo-secure-store expo-splash-screen expo-status-bar
npx expo install expo-router expo-linking expo-updates expo-web-browser
npx expo install @react-native-async-storage/async-storage
npx expo install expo-local-authentication expo-haptics
npm install zustand

# Install development dependencies
npm install -D @types/react @types/react-native
```

### app.config.ts
```typescript
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'DharmaSaathi',
  slug: 'dharmasaathi',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'dharmasaathi',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#8B5CF6'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.dharmasaathi.app',
    buildNumber: '1',
    infoPlist: {
      NSFaceIDUsageDescription: 'DharmaSaathi uses Face ID to secure your account',
      NSCameraUsageDescription: 'DharmaSaathi needs camera access to update your profile photo',
      NSPhotoLibraryUsageDescription: 'DharmaSaathi needs photo library access to select profile photos'
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#8B5CF6'
    },
    package: 'com.dharmasaathi.app',
    versionCode: 1,
    permissions: ['CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE']
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    eas: {
      projectId: 'your-eas-project-id'
    },
    webUrl: 'https://dhrmsthiwebview.vercel.app',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#8B5CF6',
        sounds: ['./assets/sounds/notification.wav']
      }
    ]
  ],
  updates: {
    url: 'https://u.expo.dev/your-eas-project-id'
  },
  runtimeVersion: {
    policy: 'sdkVersion'
  }
});
```

## 2. Core Components Implementation

### app/_layout.tsx - Root Layout
```typescript
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { setupNotifications } from '@/services/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="notification-settings" 
            options={{ 
              title: 'Notification Settings',
              presentation: 'modal' 
            }} 
          />
        </Stack>
      </NotificationProvider>
    </AuthProvider>
  );
}
```

### app/(tabs)/_layout.tsx - Tab Layout
```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useNotificationStore } from '@/stores/notificationStore';

export default function TabLayout() {
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8B5CF6',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <NotificationBadge count={unreadCount}>
              <Ionicons name="notifications" size={size} color={color} />
            </NotificationBadge>
          ),
        }}
      />
    </Tabs>
  );
}
```

### app/(tabs)/index.tsx - Main WebView Screen
```typescript
import { useRef, useState, useCallback } from 'react';
import { View, SafeAreaView, RefreshControl, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import { useRouter } from 'expo-router';
import { NativeHeader } from '@/components/NativeHeader';
import { OfflineView } from '@/components/OfflineView';
import { useWebViewBridge } from '@/hooks/useWebViewBridge';
import { useNetworkState } from '@/hooks/useNetworkState';
import { config } from '@/constants/config';

export default function HomeScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isOnline } = useNetworkState();
  const { injectedJavaScript, onMessage } = useWebViewBridge(webViewRef);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    webViewRef.current?.reload();
  }, []);

  const handleNavigationStateChange = useCallback((navState: any) => {
    // Handle navigation state changes
    console.log('Navigation:', navState.url);
  }, []);

  if (!isOnline) {
    return <OfflineView onRetry={handleRefresh} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <NativeHeader />
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: config.webUrl }}
          style={{ flex: 1 }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => {
            setLoading(false);
            setRefreshing(false);
          }}
          onMessage={onMessage}
          injectedJavaScript={injectedJavaScript}
          onNavigationStateChange={handleNavigationStateChange}
          allowsBackForwardNavigationGestures
          sharedCookiesEnabled
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
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
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
```

### components/WebViewContainer.tsx - Enhanced WebView Component
```typescript
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Platform } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

interface WebViewContainerProps {
  uri: string;
  onMessage?: (event: WebViewMessageEvent) => void;
  onNavigationStateChange?: (navState: any) => void;
}

export interface WebViewContainerRef {
  reload: () => void;
  goBack: () => void;
  goForward: () => void;
  postMessage: (message: string) => void;
}

export const WebViewContainer = forwardRef<WebViewContainerRef, WebViewContainerProps>(
  ({ uri, onMessage, onNavigationStateChange }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const { token, user } = useAuthStore();
    const { pushToken } = useNotificationStore();

    useImperativeHandle(ref, () => ({
      reload: () => webViewRef.current?.reload(),
      goBack: () => webViewRef.current?.goBack(),
      goForward: () => webViewRef.current?.goForward(),
      postMessage: (message: string) => webViewRef.current?.postMessage(message),
    }));

    const injectedJavaScript = `
      (function() {
        // Inject native app info
        window.isNativeApp = true;
        window.nativePlatform = '${Platform.OS}';
        window.nativeVersion = '${Platform.Version}';
        
        // Inject auth token if available
        ${token ? `window.nativeAuthToken = '${token}';` : ''}
        
        // Inject push token if available
        ${pushToken ? `window.nativePushToken = '${pushToken}';` : ''}
        
        // Bridge for web to native communication
        window.nativeBridge = {
          postMessage: function(data) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
          },
          
          // Auth methods
          getAuthToken: function() {
            return window.nativeAuthToken;
          },
          
          // Push notification methods
          getPushToken: function() {
            return window.nativePushToken;
          },
          
          requestNotificationPermission: function() {
            window.nativeBridge.postMessage({
              type: 'REQUEST_NOTIFICATION_PERMISSION'
            });
          },
          
          // Navigation methods
          openExternalUrl: function(url) {
            window.nativeBridge.postMessage({
              type: 'OPEN_EXTERNAL_URL',
              payload: { url }
            });
          },
          
          // Haptic feedback
          triggerHaptic: function(type = 'light') {
            window.nativeBridge.postMessage({
              type: 'HAPTIC_FEEDBACK',
              payload: { type }
            });
          }
        };
        
        // Override console methods to send logs to native
        const originalLog = console.log;
        console.log = function(...args) {
          originalLog.apply(console, args);
          window.nativeBridge.postMessage({
            type: 'CONSOLE_LOG',
            payload: { args }
          });
        };
        
        true; // Required for injection to work
      })();
    `;

    return (
      <WebView
        ref={webViewRef}
        source={{ uri }}
        style={{ flex: 1 }}
        injectedJavaScript={injectedJavaScript}
        onMessage={onMessage}
        onNavigationStateChange={onNavigationStateChange}
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        mixedContentMode="compatibility"
        userAgent={`DharmaSaathi/${Platform.OS}`}
      />
    );
  }
);
```

## 3. Push Notification Implementation

### services/notifications.ts
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useNotificationStore } from '@/stores/notificationStore';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function setupNotifications() {
  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permissions not granted');
    return;
  }

  // Get push token
  const token = await registerForPushNotificationsAsync();
  if (token) {
    useNotificationStore.getState().setPushToken(token);
    await savePushTokenToServer(token);
  }

  // Set up notification listeners
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    handleIncomingNotification(notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    handleNotificationResponse(response);
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    console.log('Push token:', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
    });
  }

  return token;
}

async function savePushTokenToServer(token: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving push token:', error);
    }
  } catch (error) {
    console.error('Error in savePushTokenToServer:', error);
  }
}

function handleIncomingNotification(notification: Notifications.Notification) {
  const { type, data } = notification.request.content.data as any;
  
  // Update local state
  useNotificationStore.getState().addNotification({
    id: notification.request.identifier,
    type,
    title: notification.request.content.title || '',
    body: notification.request.content.body || '',
    data,
    read: false,
    createdAt: new Date().toISOString(),
  });
  
  // Update badge count
  useNotificationStore.getState().incrementUnreadCount();
}

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const { type, data } = response.notification.request.content.data as any;
  
  // Handle navigation based on notification type
  switch (type) {
    case 'message':
      // Navigate to messages screen with match ID
      navigateToMessages(data.matchId);
      break;
    case 'like':
    case 'superlike':
      // Navigate to likes screen
      navigateToLikes();
      break;
    case 'match':
      // Navigate to match celebration or matches screen
      navigateToMatch(data.matchId);
      break;
    default:
      // Navigate to notifications screen
      navigateToNotifications();
  }
}

// Navigation helpers (implement based on your routing setup)
function navigateToMessages(matchId: string) {
  // Implementation depends on your navigation setup
  console.log('Navigate to messages:', matchId);
}

function navigateToLikes() {
  console.log('Navigate to likes');
}

function navigateToMatch(matchId: string) {
  console.log('Navigate to match:', matchId);
}

function navigateToNotifications() {
  console.log('Navigate to notifications');
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      badge: 1,
    },
    trigger: trigger || null, // null means immediately
  });
}
```

## 4. State Management with Zustand

### stores/authStore.ts
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email?: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => set({ token }),

      login: async (token, user) => {
        // Save token securely
        await SecureStore.setItemAsync('authToken', token);
        set({ token, user, isAuthenticated: true });
      },

      logout: async () => {
        // Clear secure storage
        await SecureStore.deleteItemAsync('authToken');
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const token = await SecureStore.getItemAsync('authToken');
          if (token) {
            // Validate token with your backend
            // For now, just set it if it exists
            set({ token, isAuthenticated: true });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }), // Only persist user, not token
    }
  )
);
```

### stores/notificationStore.ts
```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationItem {
  id: string;
  type: 'message' | 'like' | 'superlike' | 'match';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  pushToken: string | null;
  preferences: {
    messages: boolean;
    likes: boolean;
    superlikes: boolean;
    matches: boolean;
    dailyReminders: boolean;
  };
  setPushToken: (token: string) => void;
  addNotification: (notification: NotificationItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  incrementUnreadCount: () => void;
  updatePreferences: (preferences: Partial<NotificationState['preferences']>) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  pushToken: null,
  preferences: {
    messages: true,
    likes: true,
    superlikes: true,
    matches: true,
    dailyReminders: false,
  },

  setPushToken: (token) => set({ pushToken: token }),

  addNotification: (notification) => 
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearNotifications: () =>
    set({
      notifications: [],
      unreadCount: 0,
    }),

  incrementUnreadCount: () =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
    })),

  updatePreferences: async (preferences) => {
    set((state) => ({
      preferences: { ...state.preferences, ...preferences },
    }));
    // Save to AsyncStorage
    await AsyncStorage.setItem(
      'notificationPreferences',
      JSON.stringify(get().preferences)
    );
  },
}));
```

## 5. WebView Bridge Implementation

### hooks/useWebViewBridge.ts
```typescript
import { useCallback, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { router } from 'expo-router';

export function useWebViewBridge(webViewRef: React.RefObject<WebView>) {
  const { user, token, login, logout } = useAuthStore();
  const { pushToken, preferences } = useNotificationStore();

  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', message);

      switch (message.type) {
        case 'AUTH_LOGIN':
          await handleLogin(message.payload);
          break;
          
        case 'AUTH_LOGOUT':
          await handleLogout();
          break;
          
        case 'REQUEST_NOTIFICATION_PERMISSION':
          await handleNotificationPermission();
          break;
          
        case 'UPDATE_NOTIFICATION_PREFERENCES':
          await handleUpdatePreferences(message.payload);
          break;
          
        case 'OPEN_EXTERNAL_URL':
          await handleOpenUrl(message.payload.url);
          break;
          
        case 'HAPTIC_FEEDBACK':
          await handleHapticFeedback(message.payload.type);
          break;
          
        case 'NAVIGATE':
          handleNavigation(message.payload.route);
          break;
          
        case 'CONSOLE_LOG':
          console.log('[WebView]', ...message.payload.args);
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  }, []);

  const handleLogin = async (payload: any) => {
    const { token, user } = payload;
    await login(token, user);
    
    // Send success message back to WebView
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'AUTH_LOGIN_SUCCESS',
      payload: { user, token }
    }));
  };

  const handleLogout = async () => {
    await logout();
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'AUTH_LOGOUT_SUCCESS'
    }));
  };

  const handleNotificationPermission = async () => {
    // This is handled by the notifications service
    // Send back the current push token if available
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'PUSH_TOKEN_UPDATE',
      payload: { pushToken }
    }));
  };

  const handleUpdatePreferences = async (prefs: any) => {
    useNotificationStore.getState().updatePreferences(prefs);
  };

  const handleOpenUrl = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const handleHapticFeedback = async (type: string) => {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  };

  const handleNavigation = (route: string) => {
    // Handle native navigation
    router.push(route as any);
  };

  // Inject JavaScript that includes current state
  const injectedJavaScript = `
    (function() {
      // Update auth state
      window.nativeAuthToken = '${token || ''}';
      window.nativePushToken = '${pushToken || ''}';
      window.nativeUser = ${user ? JSON.stringify(user) : 'null'};
      window.nativePreferences = ${JSON.stringify(preferences)};
      
      // Notify web app that native bridge is ready
      window.dispatchEvent(new CustomEvent('nativeBridgeReady', {
        detail: {
          isAuthenticated: ${!!token},
          pushToken: '${pushToken || ''}',
          user: window.nativeUser,
          preferences: window.nativePreferences
        }
      }));
      
      true;
    })();
  `;

  return {
    onMessage: handleMessage,
    injectedJavaScript,
  };
}
```

## 6. Supabase Edge Functions for Push Notifications

### supabase/functions/send-push-notification/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, type, title, body, data } = await req.json()

    // Get user's push token
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('push_token, notification_preferences')
      .eq('id', userId)
      .single()

    if (userError || !user?.push_token) {
      throw new Error('User not found or no push token')
    }

    // Check if user has enabled this notification type
    const preferences = user.notification_preferences || {}
    if (!preferences[type]) {
      return new Response(JSON.stringify({ 
        message: 'User has disabled this notification type' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Send to Expo Push Notification Service
    const message = {
      to: user.push_token,
      sound: 'default',
      title,
      body,
      data: {
        type,
        ...data
      },
      priority: type === 'message' ? 'high' : 'default',
      badge: 1,
    }

    const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const result = await expoPushResponse.json()

    // Store notification in database
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      data,
      sent_at: new Date().toISOString(),
    })

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### supabase/functions/notification-triggers/index.ts
```typescript
// Database triggers for automatic notifications
// These would be set up as PostgreSQL functions and triggers

-- Trigger for new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
BEGIN
  -- Get the recipient ID (the other user in the match)
  SELECT CASE 
    WHEN m.user1_id = NEW.sender_id THEN m.user2_id
    ELSE m.user1_id
  END INTO recipient_id
  FROM matches m
  WHERE m.id = NEW.match_id;
  
  -- Get sender's name
  SELECT first_name || ' ' || last_name INTO sender_name
  FROM users
  WHERE id = NEW.sender_id;
  
  -- Call edge function to send push notification
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-push-notification',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
    body := jsonb_build_object(
      'userId', recipient_id,
      'type', 'message',
      'title', 'New Message',
      'body', sender_name || ' sent you a message',
      'data', jsonb_build_object('matchId', NEW.match_id)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- Similar triggers for likes, superlikes, and matches
```

## 7. Additional Components

### components/NativeHeader.tsx
```typescript
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

export function NativeHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  return (
    <View style={{
      paddingTop: insets.top,
      backgroundColor: '#8B5CF6',
      paddingHorizontal: 16,
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={require('@/assets/logo-white.png')}
          style={{ width: 120, height: 30 }}
          resizeMode="contain"
        />
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          style={{ position: 'relative' }}
        >
          <Ionicons name="notifications" size={24} color="white" />
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute',
              top: -5,
              right: -5,
              backgroundColor: '#EF4444',
              borderRadius: 10,
              width: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        {user?.profilePhotoUrl && (
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Image
              source={{ uri: user.profilePhotoUrl }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: 'white',
              }}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
```

## 8. Build and Deployment Configuration

### eas.json
```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-large"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-supabase-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "track": "production",
        "releaseStatus": "completed",
        "serviceAccountKeyPath": "./google-services-key.json"
      }
    }
  }
}
```

## 9. Testing Push Notifications

### test-utils/sendTestNotification.ts
```typescript
export async function sendTestNotification(userId: string, type: string) {
  const response = await fetch('https://your-project.supabase.co/functions/v1/send-push-notification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      userId,
      type,
      title: getTestTitle(type),
      body: getTestBody(type),
      data: getTestData(type),
    }),
  });

  return response.json();
}

function getTestTitle(type: string) {
  switch (type) {
    case 'message':
      return 'New Message';
    case 'like':
      return 'Someone Liked You!';
    case 'superlike':
      return 'You Got a Super Like!';
    case 'match':
      return 'It\'s a Match!';
    default:
      return 'DharmaSaathi';
  }
}

function getTestBody(type: string) {
  switch (type) {
    case 'message':
      return 'Priya sent you a message';
    case 'like':
      return 'Someone is interested in your profile';
    case 'superlike':
      return 'You received a Super Like! Check who it is';
    case 'match':
      return 'You and Rahul have matched! Start a conversation';
    default:
      return 'Check out what\'s new';
  }
}

function getTestData(type: string) {
  return {
    timestamp: new Date().toISOString(),
    testNotification: true,
    // Add type-specific data
  };
}
```

This implementation guide provides a solid foundation for building your Expo React Native WebView app with push notifications. The code is modular, type-safe, and follows best practices for React Native development.
