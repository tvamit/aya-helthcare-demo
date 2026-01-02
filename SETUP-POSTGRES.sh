#!/bin/bash

echo "🗄️  Setting up PostgreSQL for Hospital AI..."
echo ""

# Create postgres user if needed
echo "Creating database and user..."
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE hospital_ai;

-- Create user (if needed)
CREATE USER techvoot WITH PASSWORD 'postgres';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hospital_ai TO techvoot;

-- Connect to hospital_ai
\c hospital_ai

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO techvoot;

EOF

echo ""
echo "✅ PostgreSQL setup complete!"
echo ""
echo "Database: hospital_ai"
echo "User: techvoot"
echo "Password: postgres"
echo ""
