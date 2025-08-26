#!/bin/bash

echo "⏰ Setting up Notification Dispatcher Cron Job..."
echo ""
echo "This will ensure notifications are sent every minute."
echo ""

# Option 1: Using crontab (for local testing)
if command -v crontab &> /dev/null; then
  echo "📝 Adding cron job to your system..."
  
  # Check if cron job already exists
  if crontab -l 2>/dev/null | grep -q "notifications-dispatcher"; then
    echo "⚠️  Cron job already exists"
  else
    # Add new cron job
    (crontab -l 2>/dev/null; echo "* * * * * curl -s -X POST https://kcuqbsrurlkfuxrybwqq.supabase.co/functions/v1/notifications-dispatcher -H \"Authorization: Bearer $(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2)\" -H \"Content-Type: application/json\" -d '{}' > /tmp/notification-dispatcher.log 2>&1") | crontab -
    echo "✅ Cron job added to run every minute"
  fi
fi

# Option 2: Provide Supabase Dashboard instructions
echo ""
echo "📌 IMPORTANT: Set up in Supabase Dashboard"
echo "========================================="
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/kcuqbsrurlkfuxrybwqq/functions/notifications-dispatcher"
echo ""
echo "2. Click on 'Schedule' or 'Cron' tab"
echo ""
echo "3. Add this cron expression:"
echo "   * * * * *"
echo "   (This runs every minute)"
echo ""
echo "4. Save the schedule"
echo ""
echo "OR use an external service like:"
echo "- EasyCron.com"
echo "- Cron-job.org" 
echo "- UptimeRobot.com"
echo ""
echo "URL to call: https://kcuqbsrurlkfuxrybwqq.supabase.co/functions/v1/notifications-dispatcher"
echo "Method: POST"
echo "Headers: Authorization: Bearer [YOUR_SERVICE_KEY]"
echo ""

# Test the dispatcher
echo "🔔 Testing dispatcher now..."
./scripts/trigger-notifications.sh
