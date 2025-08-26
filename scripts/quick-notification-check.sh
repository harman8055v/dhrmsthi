#!/bin/bash

echo "🔍 Quick Notification System Check..."
echo ""

DB_HOST="db.kcuqbsrurlkfuxrybwqq.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "Please enter your database password:"
read -s DB_PASSWORD
echo ""

echo "📊 Checking notification system..."
echo ""

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Check tokens
SELECT 'Push Tokens:' as info, COUNT(*) as count FROM expo_push_tokens;

-- Check recent jobs
SELECT 'Recent Jobs by Status:' as info, status, COUNT(*) 
FROM notification_jobs 
WHERE created_at > NOW() - INTERVAL '1 hour' 
GROUP BY status;

-- Check users without tokens
SELECT 'Jobs without tokens:' as info, COUNT(*)
FROM notification_jobs j
LEFT JOIN expo_push_tokens t ON j.recipient_id = t.user_id
WHERE j.created_at > NOW() - INTERVAL '1 hour'
  AND t.token IS NULL;
EOF

echo ""
echo "📝 Summary:"
echo "If 'Jobs without tokens' > 0, users need to enable push notifications in the app"
echo "If jobs show as 'sent' but no notifications arrive, check Expo/Firebase setup"
