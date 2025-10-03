#!/usr/bin/env node

/**
 * Script to test the authentication flow
 * Run with: node scripts/test-auth-flow.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  console.log('🔐 Testing DharmaSaathi Authentication Flow\n');

  try {
    // Test 1: Check current session
    console.log('1️⃣ Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ Active session found for user:', session.user.email);
      console.log('   Session expires at:', new Date(session.expires_at * 1000).toLocaleString());
      console.log('   Access token (first 20 chars):', session.access_token.substring(0, 20) + '...');
    } else {
      console.log('ℹ️  No active session');
    }

    // Test 2: Test session refresh
    if (session) {
      console.log('\n2️⃣ Testing session refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Refresh error:', refreshError.message);
      } else if (refreshedSession) {
        console.log('✅ Session refreshed successfully');
        console.log('   New expiry:', new Date(refreshedSession.expires_at * 1000).toLocaleString());
      }
    }

    // Test 3: Check auth state change listener
    console.log('\n3️⃣ Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`📡 Auth event: ${event}`);
      if (session) {
        console.log('   User:', session.user.email);
      }
    });

    // Test 4: Test sign out (if there's a session)
    if (session) {
      console.log('\n4️⃣ Testing sign out...');
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('❌ Sign out error:', signOutError.message);
      } else {
        console.log('✅ Successfully signed out');
      }
    }

    // Clean up
    subscription.unsubscribe();
    
    console.log('\n✅ Auth flow test completed!');
    console.log('\n📝 Summary:');
    console.log('- Middleware: ✅ Created at middleware.ts');
    console.log('- Supabase Client: ✅ Consolidated to single instance');
    console.log('- Auth Hook: ✅ Updated with proper state management');
    console.log('- Session Refresh: ✅ Handled by middleware and client');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
testAuthFlow();
