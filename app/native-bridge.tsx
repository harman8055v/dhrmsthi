"use client";
import { useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Type declaration for ReactNativeWebView
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export default function NativeBridge() {
  const supabase = createClientComponentClient();
  const pendingTokenRef = useRef<{token:string, platform:string}|null>(null);
  const hasSavedRef = useRef(false);
  const hasRequestedTokenRef = useRef(false);

  // Function to request push token from native app
  const requestPushTokenFromNative = () => {
    if (window.ReactNativeWebView && !hasRequestedTokenRef.current) {
      console.log('📱 Requesting push token from native app');
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'request_push_token'
      }));
      
      hasRequestedTokenRef.current = true;
    } else if (!window.ReactNativeWebView) {
      console.log('ℹ️ Not running in native app - skipping token request');
    }
  };

  // Function to handle received push token
  const handlePushToken = async (payload: {token: string, platform: string}) => {
    const { token, platform } = payload;
    
    console.log('🔑 Received push token:', token);
    console.log('📱 Platform:', platform);
    
    if (!token) {
      console.warn('⚠️ No push token received - permissions may be denied');
      return;
    }
    
    pendingTokenRef.current = { token, platform };
    await trySaveToken();
  };

  async function trySaveToken() {
    if (!pendingTokenRef.current || hasSavedRef.current) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('⏳ User not authenticated yet, queuing token...');
      return; // Wait for user to be logged in
    }
    
    const { token, platform } = pendingTokenRef.current;
    
    try {
      console.log('💾 Saving push token to server...');
      const res = await fetch("/api/expo/save-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token, 
          platform,
          timestamp: new Date().toISOString()
        }),
      });
      
      if (res.ok) {
        console.log('✅ Push token saved successfully');
        hasSavedRef.current = true;
      } else {
        console.error('❌ Failed to save push token:', res.status);
      }
    } catch (error) {
      console.error('❌ Error saving push token:', error);
    }
  }

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      try {
        const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        console.log('📱 Message from native app:', msg);
        
        if (msg?.type === "expo_push_token" && msg?.payload?.token) {
          handlePushToken({
            token: msg.payload.token,
            platform: msg.payload.platform || "android",
          });
        }
      } catch (error) {
        console.error('Error parsing native message:', error);
      }
    }
    
    window.addEventListener("message", onMsg);

    // Monitor auth state changes and request token after login
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User authenticated:', session.user.id);
        
        // Request push token from native app after successful auth
        setTimeout(() => {
          requestPushTokenFromNative();
        }, 1000); // Small delay to ensure everything is ready
      }
      
      // Also retry saving any queued tokens
      trySaveToken();
    });

    // Check if user is already authenticated on component mount
    const checkAuthAndRequestToken = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('✅ User already authenticated:', user.id);
        // Request token if we haven't already
        setTimeout(() => {
          requestPushTokenFromNative();
        }, 500);
      }
    };
    
    checkAuthAndRequestToken();

    return () => {
      window.removeEventListener("message", onMsg);
      sub?.subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  // Expose test function for debugging
  useEffect(() => {
    const testNativeCommunication = () => {
      console.log('🧪 Testing native communication...');
      requestPushTokenFromNative();
      
      // Test receiving message (mock)
      setTimeout(() => {
        handlePushToken({
          token: 'ExponentPushToken[TEST_TOKEN_123]',
          platform: 'android'
        });
      }, 2000);
    };

    (window as any).testNativeCommunication = testNativeCommunication;
    
    return () => {
      delete (window as any).testNativeCommunication;
    };
  }, []);

  useEffect(() => {
    const testNativeCommunication = () => {
      console.log('🧪 Testing native communication...');
      requestPushTokenFromNative();
      
      // Test receiving message (mock)
      setTimeout(() => {
        handlePushToken({
          token: 'ExponentPushToken[TEST_TOKEN_123]',
          platform: 'android'
        });
      }, 2000);
    };

    (window as any).testNativeCommunication = testNativeCommunication;
    
    return () => {
      delete (window as any).testNativeCommunication;
    };
  }, []);

  return null; // This is a bridge component, no UI
}
