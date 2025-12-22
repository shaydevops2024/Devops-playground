#!/bin/bash

# Bulk User Creation Script
# Creates 50 test users in the database

set -e

echo "👥 Creating 50 Test Users..."
echo ""

# Database connection details
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-devops_playground}"
DB_USER="${DB_USER:-devops_admin}"
DB_PASS="${DB_PASS:-DevOps2024!Secure}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) not found in container"
    exit 1
fi

echo "🔌 Connecting to database: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Create SQL script for bulk insert (fixed variable names)
cat > /tmp/create_users.sql << 'EOF'
-- Create 50 test users
DO $$
DECLARE
    i INTEGER;
    v_username TEXT;
    v_email TEXT;
    -- Pre-hashed password for "TestUser123!" using bcrypt
    v_password_hash TEXT := '$2b$10$rXKvNQI4YmXUmXkPHEr7Z.VGLz1g6K9qPX7Q3N5bZ8Y9X6M7W8U9K';
BEGIN
    FOR i IN 1..50 LOOP
        v_username := 'test_user_' || LPAD(i::TEXT, 3, '0');
        v_email := 'test_user_' || LPAD(i::TEXT, 3, '0') || '@test.local';
        
        -- Insert user (ignore if already exists)
        INSERT INTO users (username, email, password_hash, is_active, theme_preference)
        VALUES (v_username, v_email, v_password_hash, true, 'light')
        ON CONFLICT (username) DO NOTHING;
        
        IF i % 10 = 0 THEN
            RAISE NOTICE 'Created % users...', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully processed 50 test users!';
END $$;

-- Show user count
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE username LIKE 'test_user_%') as test_users
FROM users;
EOF

# Execute the SQL script
export PGPASSWORD="$DB_PASS"

echo "📝 Executing bulk user creation..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/create_users.sql

# Clean up
rm -f /tmp/create_users.sql
unset PGPASSWORD

echo ""
echo "✅ Test users created successfully!"
echo "👤 Username pattern: test_user_001 to test_user_050"
echo "📧 Email pattern: test_user_001@test.local to test_user_050@test.local"
echo "🔑 Password (all users): TestUser123!"
echo ""
echo "📊 Check Grafana dashboard to see database metrics"
echo ""