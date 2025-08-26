#!/bin/bash

echo "🔔 Triggering Notification Dispatcher..."
echo ""
echo "This will process all pending notifications immediately."
echo ""

# Get service key from .env.local
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2)

if [ -z "$SERVICE_KEY" ]; then
  echo "❌ Could not find SUPABASE_SERVICE_ROLE_KEY in .env.local"
  exit 1
fi

# Trigger the dispatcher
echo "📤 Sending notifications..."

RESPONSE=$(curl -s -X POST \
  "https://kcuqbsrurlkfuxrybwqq.supabase.co/functions/v1/notifications-dispatcher" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}')

echo ""
echo "Response: $RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "✅ Notifications processed successfully!"
  
  # Extract numbers if present
  PROCESSED=$(echo "$RESPONSE" | grep -o '"processed":[0-9]*' | cut -d':' -f2)
  DELIVERED=$(echo "$RESPONSE" | grep -o '"delivered":[0-9]*' | cut -d':' -f2)
  
  if [ ! -z "$PROCESSED" ]; then
    echo "   Processed: $PROCESSED jobs"
  fi
  if [ ! -z "$DELIVERED" ]; then
    echo "   Delivered: $DELIVERED notifications"
  fi
else
  echo "⚠️  Check if there were any pending notifications to send"
fi

echo ""
echo "📌 To check notification status, run:"
echo "   psql <connection> -c \"SELECT status, COUNT(*) FROM notification_jobs WHERE created_at > NOW() - INTERVAL '1 hour' GROUP BY status;\""
