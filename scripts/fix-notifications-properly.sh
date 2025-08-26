#!/bin/bash

echo "🔧 Fixing Duplicate Notifications Issue..."
echo ""
echo "This will fix the notification system so you only get:"
echo "  • Match notification when someone likes you back (not like + match)"
echo "  • Like notification only when someone likes you first"
echo ""

# Database connection details
DB_HOST="db.kcuqbsrurlkfuxrybwqq.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "Please enter your database password:"
read -s DB_PASSWORD
echo ""

echo "📝 Applying notification fix..."
echo ""

# Execute the fix
PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -f scripts/fix-duplicate-notifications.sql \
  --quiet \
  --no-psqlrc

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Notification system fixed successfully!"
  echo ""
  echo "📌 How it works now:"
  echo "  • When someone likes you → You get a LIKE notification"
  echo "  • When you like them back → They get a MATCH notification (not another like)"
  echo "  • When someone likes you back → You get a MATCH notification (not a like)"
  echo ""
  echo "No more duplicate notifications! 🎉"
else
  echo ""
  echo "❌ Error applying fix. Please check your password and try again."
fi
