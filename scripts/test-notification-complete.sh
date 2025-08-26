#!/bin/bash

echo "🔔 Complete Notification Test..."
echo ""

DB_HOST="db.kcuqbsrurlkfuxrybwqq.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "Please enter your database password:"
read -s DB_PASSWORD
echo ""

echo "Step 1: Creating test notification..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/test-notification.sql

echo ""
echo "Step 2: Triggering dispatcher..."

# Get service key
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2)

# Trigger dispatcher
RESPONSE=$(curl -s -X POST \
  "https://kcuqbsrurlkfuxrybwqq.supabase.co/functions/v1/notifications-dispatcher" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Dispatcher Response: $RESPONSE"

echo ""
echo "Step 3: Checking if notification was processed..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
SELECT 
  'Test notification status:' as info,
  status,
  updated_at,
  error
FROM notification_jobs
WHERE payload->>'senderName' = 'Test Notification'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;
EOF

echo ""
echo "Step 4: Manual Expo test..."
echo "Testing direct Expo API call..."

# Get a token to test
TOKEN=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT token FROM expo_push_tokens LIMIT 1;" | tr -d ' ')

if [ ! -z "$TOKEN" ]; then
  echo "Found token: ${TOKEN:0:30}..."
  
  # Get Expo access token
  EXPO_TOKEN=$(grep EXPO_ACCESS_TOKEN .env.local | cut -d'=' -f2)
  
  if [ ! -z "$EXPO_TOKEN" ]; then
    echo "Testing direct Expo API..."
    
    EXPO_RESPONSE=$(curl -s -X POST \
      "https://exp.host/--/api/v2/push/send" \
      -H "Accept: application/json" \
      -H "Accept-encoding: gzip, deflate" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $EXPO_TOKEN" \
      -d "{
        \"to\": \"$TOKEN\",
        \"title\": \"Direct Test\",
        \"body\": \"This is a direct Expo API test\",
        \"data\": {\"test\": true}
      }")
    
    echo "Direct Expo Response: $EXPO_RESPONSE"
  else
    echo "❌ No EXPO_ACCESS_TOKEN found in .env.local"
  fi
else
  echo "❌ No push tokens found in database"
fi

echo ""
echo "🔍 Diagnosis:"
echo "============="
echo "1. If test notification status = 'sent' → Backend is working"
echo "2. If Direct Expo test shows error → Expo token/config issue"
echo "3. If both work but no notification → Device/app permission issue"
echo ""
echo "📱 Check on your device:"
echo "- App notification permissions enabled?"
echo "- Phone in Do Not Disturb mode?"
echo "- App running in background?"
