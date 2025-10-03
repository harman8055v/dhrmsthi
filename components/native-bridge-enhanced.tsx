"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Enhanced bridge that sends user ID to native app for direct registration
export default function NativeBridgeEnhanced() {

  useEffect(() => {
    // Monitor auth state and notify native app
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔐 User signed in, notifying native app');
        
        // Send user ID to native app for direct push registration
        if (window.ReactNativeWebView?.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'user_logged_in',
            userId: session.user.id
          }));
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 User signed out, notifying native app');
        
        if (window.ReactNativeWebView?.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'user_logged_out'
          }));
        }
      }
    });

    // Check initial auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('🔐 User already authenticated, notifying native app');
        if (window.ReactNativeWebView?.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'user_logged_in',
            userId: user.id
          }));
        }
      }
    };
    
    checkAuth();

    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, []);

  return null;
}
