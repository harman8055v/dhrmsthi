#!/bin/bash

# Supabase connection details
SUPABASE_URL="https://kcuqbsrurlkfuxrybwqq.supabase.co"
DB_HOST="db.kcuqbsrurlkfuxrybwqq.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "Please enter the database password (from Supabase Dashboard > Settings > Database):"
read -s DB_PASSWORD

echo "Connecting to database and running fix-realtime-subscription.sql..."

# Run the SQL script
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/fix-realtime-subscription.sql

echo "SQL script execution completed!"
