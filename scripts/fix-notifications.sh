#!/bin/bash

echo "🔔 Restoring Notification Triggers..."
echo ""
echo "The real-time fix may have affected notification triggers."
echo "This script will restore them."
echo ""

# Database connection details
DB_HOST="db.kcuqbsrurlkfuxrybwqq.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "Please enter your database password:"
read -s DB_PASSWORD
echo ""

echo "📝 Restoring notification triggers..."
echo ""

# Execute the notification fix SQL
PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -f scripts/restore-notification-triggers.sql \
  --quiet \
  --no-psqlrc

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Notification triggers restored successfully!"
  echo ""
  echo "📌 Notifications should now work again:"
  echo "1. Message notifications"
  echo "2. Like notifications" 
  echo "3. Match notifications"
  echo ""
  echo "Test by sending a message from another account!"
else
  echo ""
  echo "❌ Error restoring triggers. Please check your password and try again."
fi
