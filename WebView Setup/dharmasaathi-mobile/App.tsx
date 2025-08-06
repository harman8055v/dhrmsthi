import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  BackHandler,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { WebViewService, NotificationService, LinkingService, CameraService } from './src/services';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Keep splash screen visible
SplashScreen.preventAutoHideAsync();

// Configure URLs for different environments
const isDevelopment = __DEV__;
const PRODUCTION_URL = 'https://dharmasaathi.com';
const DEVELOPMENT_URL = 'http://192.168.29.199:3000'; // Your local IP from the Next.js output
const DHARMASAATHI_URL = isDevelopment ? DEVELOPMENT_URL : PRODUCTION_URL;

console.log('WebView will load:', DHARMASAATHI_URL);

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(DHARMASAATHI_URL);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // Handle Android back button
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize services
      await NotificationService.initialize();
      LinkingService.initialize(handleDeepLink);
      
      // Handle initial deep link if app was opened via link
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && LinkingService.isValidDharmaSaathiUrl(initialUrl)) {
        setCurrentUrl(initialUrl);
      }

      // Hide splash screen
      await SplashScreen.hideAsync();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  const handleBackPress = (): boolean => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
      return true; // Prevent default back action
    }
    return false;
  };

  const handleDeepLink = (url: string) => {
    if (LinkingService.isValidDharmaSaathiUrl(url)) {
      setCurrentUrl(url);
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`window.location.href = '${url}';`);
      }
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'camera':
          CameraService.handleCameraRequest(message.payload, (result: any) => {
            WebViewService.sendMessageToWebView(webViewRef.current, {
              type: 'cameraResult',
              payload: result,
            });
          });
          break;
        
        case 'notification':
          NotificationService.scheduleLocalNotification(
            message.payload.title,
            message.payload.body,
            message.payload.data
          );
          break;
        
        case 'share':
          Linking.openURL(`mailto:?subject=${message.payload.subject}&body=${message.payload.body}`);
          break;
        
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    
    // Inject JavaScript for native integration
    const injectedJS = WebViewService.getInjectedJavaScript();
    if (webViewRef.current && injectedJS) {
      webViewRef.current.injectJavaScript(injectedJS);
    }
  };

  const handleError = (errorEvent: any) => {
    console.error('WebView error:', errorEvent.nativeEvent);
    setIsLoading(false);
    setHasError(true);
  };

  const handleReload = () => {
    setHasError(false);
    setCurrentUrl(DHARMASAATHI_URL);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Connection Error</Text>
      <Text style={styles.errorMessage}>
        Please check your internet connection and try again.
      </Text>
      <Text style={styles.retryButton} onPress={handleReload}>
        Retry
      </Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#e91e63" />
      <Text style={styles.loadingText}>Loading DharmaSaathi...</Text>
    </View>
  );

  if (hasError) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="auto" />
          {renderError()}
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {isLoading && renderLoading()}
        
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webview}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          allowsBackForwardNavigationGestures={true}
          allowsLinkPreview={false}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          userAgent={`DharmaSaathiApp/${Platform.OS}/1.0.0`}
          onShouldStartLoadWithRequest={(request) => {
            // Allow navigation within DharmaSaathi domain
            return LinkingService.shouldLoadInWebView(request.url);
          }}
          onNavigationStateChange={(navState) => {
            // Handle navigation state changes if needed
            console.log('Navigation:', navState.url);
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    fontSize: 18,
    color: '#e91e63',
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#e91e63',
    borderRadius: 8,
  },
});
