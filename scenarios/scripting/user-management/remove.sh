#!/bin/bash

# Bulk User Removal Script
# Removes all test users created by the creation script

set -e

echo "🗑️  Removing Test Users..."
echo ""

# Database connection details
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-devops_playground}"
DB_USER="${DB_USER:-devops_admin}"
DB_PASS="${DB_PASS:-DevOps2024!Secure}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client not found. Cannot proceed."
    exit 1
fi

echo "🔌 Connecting to database: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Create SQL script for bulk delete
cat > /tmp/remove_users.sql << 'EOF'
-- Count test users before deletion
SELECT 
    COUNT(*) FILTER (WHERE username LIKE 'test_user_%') as test_users_to_delete
FROM users;

-- Delete all test users and their related data
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- The CASCADE will also delete related records in other tables
    DELETE FROM users 
    WHERE username LIKE 'test_user_%';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % test users', deleted_count;
END $$;

-- Show remaining user count
SELECT 
    COUNT(*) as total_remaining_users,
    COUNT(*) FILTER (WHERE username LIKE 'test_user_%') as remaining_test_users
FROM users;
EOF

# Execute the SQL script
export PGPASSWORD="$DB_PASS"

echo "📝 Executing bulk user deletion..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/remove_users.sql

# Clean up
rm -f /tmp/remove_users.sql
unset PGPASSWORD

echo ""
echo "✅ Test users removed successfully!"
echo "📊 Check Grafana dashboard to see database metrics update"
echo ""
