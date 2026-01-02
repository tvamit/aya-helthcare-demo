#!/bin/bash

echo "🗄️  Creating PostgreSQL Database for Hospital AI..."
echo ""

# Create database and user
sudo -u postgres psql << 'EOF'
-- Drop if exists (optional)
DROP DATABASE IF EXISTS hospital_ai;
DROP USER IF EXISTS techvoot;

-- Create user
CREATE USER techvoot WITH PASSWORD 'postgres';

-- Create database
CREATE DATABASE hospital_ai OWNER techvoot;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hospital_ai TO techvoot;

-- Connect and grant schema privileges
\c hospital_ai
GRANT ALL ON SCHEMA public TO techvoot;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO techvoot;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO techvoot;

\q
EOF

echo ""
echo "✅ Database created successfully!"
echo ""
echo "Database Details:"
echo "  📊 Database: hospital_ai"
echo "  👤 User: techvoot"
echo "  🔑 Password: postgres"
echo "  🌐 Host: localhost"
echo "  🔌 Port: 5432"
echo ""
echo "Testing connection..."
psql -U techvoot -d hospital_ai -c "SELECT 'Connection successful!' as status;" 2>&1

echo ""
echo "✅ Database is ready to use!"
echo ""
