#!/bin/bash

echo "🔧 Fixing Real-time Subscriptions in Supabase..."
echo ""
echo "This script needs your database password from Supabase Dashboard."
echo "You can find it in: Settings > Database > Connection string"
echo ""

# Database connection details
DB_HOST="db.kcuqbsrurlkfuxrybwqq.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "Please enter your database password:"
read -s DB_PASSWORD
echo ""

echo "📝 Executing SQL fixes..."
echo ""

# Create a temporary SQL file with the essential fixes
cat > /tmp/realtime-fix.sql << 'EOF'
-- Fix Real-time Subscription
-- ============================

-- 1. Recreate publication
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
CREATE PUBLICATION supabase_realtime FOR TABLE public.messages, public.matches;

-- 2. Set replica identity
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE matches REPLICA IDENTITY FULL;

-- 3. Ensure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 4. Create missing index
CREATE INDEX IF NOT EXISTS idx_messages_realtime 
ON messages(match_id, created_at DESC);

-- 5. Verify setup
SELECT 'Real-time fix applied successfully!' as status;
EOF

# Execute the SQL
PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -f /tmp/realtime-fix.sql \
  --quiet \
  --no-psqlrc

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Real-time fix applied successfully!"
  echo ""
  echo "📌 Next steps:"
  echo "1. Refresh your web app"
  echo "2. Check browser console for successful subscription"
  echo "3. Send a test message to verify real-time works"
else
  echo ""
  echo "❌ Error applying fix. Please check your password and try again."
  echo ""
  echo "Alternative: Go to Supabase Dashboard > SQL Editor and run:"
  echo "scripts/fix-realtime-subscription.sql"
fi

# Clean up
rm -f /tmp/realtime-fix.sql
