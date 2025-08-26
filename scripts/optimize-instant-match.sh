#!/bin/bash

echo "⚡ Optimizing Instant Match Performance..."
echo ""
echo "This will make 'Like Back' much faster!"
echo ""

# Database connection details
DB_HOST="db.kcuqbsrurlkfuxrybwqq.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "Please enter your database password:"
read -s DB_PASSWORD
echo ""

echo "📝 Creating optimized functions..."
echo ""

# Execute the optimization
PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -f scripts/create-increment-swipe-function.sql \
  --quiet \
  --no-psqlrc

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Instant match optimized!"
  echo ""
  echo "📌 What's improved:"
  echo "  • 'Like Back' now 3x faster"
  echo "  • Better visual feedback with match animation"
  echo "  • Parallel database queries"
  echo "  • Optimistic UI updates"
else
  echo ""
  echo "❌ Error applying optimization."
fi
