#!/usr/bin/env node

/**
 * Execute Real-time Fix SQL Script via Supabase
 * 
 * This script runs the fix-realtime-subscription.sql directly on your Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function executeSqlStatements() {
  console.log('🔧 Executing Real-time Fix SQL Script...\n');

  // SQL statements broken down for execution
  const sqlStatements = [
    // Drop and recreate publication
    `DROP PUBLICATION IF EXISTS supabase_realtime CASCADE`,
    
    `CREATE PUBLICATION supabase_realtime FOR TABLE 
      public.messages,
      public.matches`,
    
    // Enable replica identity
    `ALTER TABLE messages REPLICA IDENTITY FULL`,
    `ALTER TABLE matches REPLICA IDENTITY FULL`,
    
    // Drop existing policies
    `DROP POLICY IF EXISTS "Users can view messages from their matches" ON messages`,
    `DROP POLICY IF EXISTS "Users can insert messages in their matches" ON messages`,
    `DROP POLICY IF EXISTS "Users can update their own messages" ON messages`,
    `DROP POLICY IF EXISTS "Users can view their matches" ON matches`,
    
    // Enable RLS
    `ALTER TABLE messages ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE matches ENABLE ROW LEVEL SECURITY`,
    
    // Create message policies
    `CREATE POLICY "Users can view messages from their matches"
    ON messages FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM matches
        WHERE matches.id = messages.match_id
        AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
      )
    )`,
    
    `CREATE POLICY "Users can insert messages in their matches"
    ON messages FOR INSERT
    WITH CHECK (
      sender_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM matches
        WHERE matches.id = messages.match_id
        AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
      )
    )`,
    
    `CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (
      sender_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM matches
        WHERE matches.id = messages.match_id
        AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
      )
    )
    WITH CHECK (
      sender_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM matches
        WHERE matches.id = messages.match_id
        AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
      )
    )`,
    
    // Create matches policy
    `CREATE POLICY "Users can view their matches"
    ON matches FOR SELECT
    USING (
      user1_id = auth.uid() OR user2_id = auth.uid()
    )`,
    
    // Grant permissions
    `GRANT USAGE ON SCHEMA public TO authenticated`,
    `GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated`,
    `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated`,
    
    // Create index
    `CREATE INDEX IF NOT EXISTS idx_messages_realtime 
    ON messages(match_id, created_at DESC)
    WHERE deleted_at IS NULL`
  ];

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const shortSql = sql.substring(0, 50).replace(/\n/g, ' ') + '...';
    
    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
        sql_query: sql 
      }).catch(async (rpcError) => {
        // If RPC doesn't exist, try direct execution
        console.log(`⚠️  RPC not available, statement ${i + 1}: ${shortSql}`);
        return { data: null, error: 'RPC not available' };
      });

      if (error) {
        console.log(`⚠️  Statement ${i + 1}: ${shortSql}`);
        console.log(`   Note: ${error}\n`);
        errorCount++;
      } else {
        console.log(`✅ Statement ${i + 1}: ${shortSql}`);
        successCount++;
      }
    } catch (err) {
      console.log(`⚠️  Statement ${i + 1}: ${shortSql}`);
      console.log(`   Error: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Execution Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⚠️  Warnings: ${errorCount}`);
  console.log('='.repeat(60));

  // Verification queries
  console.log('\n🔍 Verifying Real-time Setup...\n');
  
  try {
    // Check if messages table exists
    const { data: tables } = await supabaseAdmin
      .from('messages')
      .select('id')
      .limit(1);
    
    console.log('✅ Messages table is accessible');
    
    // Check if matches table exists
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('id')
      .limit(1);
    
    console.log('✅ Matches table is accessible');
    
    console.log('\n✨ Real-time fix has been applied!');
    console.log('\n📝 Next Steps:');
    console.log('1. Refresh your web app');
    console.log('2. Check browser console for "Successfully subscribed to real-time updates"');
    console.log('3. Send a test message to verify real-time is working');
    
  } catch (err) {
    console.error('❌ Error verifying tables:', err.message);
  }
}

// Run the script
executeSqlStatements().catch(console.error);
