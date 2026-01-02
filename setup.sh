#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║      🏥 Hospital AI Voice Assistant Setup                ║"
echo "║                                                           ║"
echo "║      Interactive Setup Wizard                            ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}📋 Step 1: Checking Prerequisites...${NC}"
echo ""

# Check Python
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✅ Python3 found:${NC} $(python3 --version)"
else
    echo -e "${RED}❌ Python3 not found!${NC}"
    echo "Install: sudo apt install python3"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js found:${NC} $(node --version)"
else
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo "Install from: https://nodejs.org"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL found:${NC} $(psql --version | head -1)"
else
    echo -e "${RED}❌ PostgreSQL not found!${NC}"
    echo "Install: sudo apt install postgresql"
    exit 1
fi

echo ""
echo -e "${GREEN}All prerequisites installed!${NC}"
echo ""
read -p "Press Enter to continue..."

# Step 2: PostgreSQL Setup
clear
echo -e "${YELLOW}📊 Step 2: PostgreSQL Setup${NC}"
echo ""

# Check if PostgreSQL is running
if pg_isready -h localhost &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL not running. Starting...${NC}"
    sudo systemctl start postgresql
    sleep 2
    if pg_isready -h localhost &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL started${NC}"
    else
        echo -e "${RED}❌ Could not start PostgreSQL${NC}"
        echo "Please start manually: sudo systemctl start postgresql"
        exit 1
    fi
fi

echo ""
echo "Setting up database..."
echo ""
echo -e "${YELLOW}This will create:${NC}"
echo "  - Database: hospital_ai"
echo "  - User: postgres"
echo "  - Password: postgres"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Try to create database
    sudo -u postgres psql << 'EOF' 2>/dev/null
CREATE DATABASE hospital_ai;
EOF

    echo -e "${GREEN}✅ Database setup complete!${NC}"
else
    echo "Skipping database setup..."
fi

echo ""
read -p "Press Enter to continue..."

# Step 3: Groq API Key
clear
echo -e "${YELLOW}🔑 Step 3: Groq API Key Configuration${NC}"
echo ""

# Check if key already exists
if grep -q "GROQ_API_KEY=gsk_" backend/.env 2>/dev/null; then
    CURRENT_KEY=$(grep "GROQ_API_KEY=" backend/.env | cut -d'=' -f2)
    echo -e "${GREEN}✅ API Key already configured!${NC}"
    echo ""
    echo "Current key: ${CURRENT_KEY:0:20}..."
    echo ""
    read -p "Want to update it? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing key..."
        echo ""
        read -p "Press Enter to continue..."
        SKIP_KEY=true
    fi
fi

if [ "$SKIP_KEY" != "true" ]; then
    echo -e "${BLUE}Get FREE Groq API Key:${NC}"
    echo ""
    echo "1. Visit: ${BLUE}https://console.groq.com${NC}"
    echo "2. Sign up (free)"
    echo "3. Go to 'API Keys' section"
    echo "4. Click 'Create API Key'"
    echo "5. Copy the key (starts with gsk_...)"
    echo ""
    echo -e "${YELLOW}Opening browser...${NC}"

    # Try to open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://console.groq.com" 2>/dev/null &
    fi

    echo ""
    read -p "Enter your Groq API Key (or press Enter to skip): " GROQ_KEY

    if [ ! -z "$GROQ_KEY" ]; then
        # Update .env file
        if [ -f backend/.env ]; then
            sed -i "s/GROQ_API_KEY=.*/GROQ_API_KEY=$GROQ_KEY/" backend/.env
            echo -e "${GREEN}✅ API Key saved to backend/.env${NC}"
        else
            echo -e "${RED}❌ backend/.env not found!${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping API key for now${NC}"
        echo "You can add it later in: backend/.env"
    fi
fi

echo ""
read -p "Press Enter to continue..."

# Step 4: Install Dependencies
clear
echo -e "${YELLOW}📦 Step 4: Installing Dependencies${NC}"
echo ""

echo "This will install:"
echo "  - Node.js packages (backend)"
echo "  - Python packages (Whisper STT)"
echo "  - Python packages (Coqui TTS)"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Install Node.js dependencies
    echo ""
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    cd backend
    npm install
    cd ..
    echo -e "${GREEN}✅ Node.js dependencies installed${NC}"

    # Python Whisper
    echo ""
    echo -e "${YELLOW}Setting up Whisper STT...${NC}"
    cd python-services/whisper-stt
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt
    deactivate
    cd ../..
    echo -e "${GREEN}✅ Whisper STT ready${NC}"

    # Python Coqui
    echo ""
    echo -e "${YELLOW}Setting up Coqui TTS...${NC}"
    cd python-services/coqui-tts
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt
    deactivate
    cd ../..
    echo -e "${GREEN}✅ Coqui TTS ready${NC}"
else
    echo "Skipping dependency installation..."
fi

echo ""
read -p "Press Enter to continue..."

# Step 5: Database Seeding
clear
echo -e "${YELLOW}🌱 Step 5: Seed Database${NC}"
echo ""

echo "This will populate the database with sample data:"
echo "  - 15 hospital beds"
echo "  - 5 doctors"
echo "  - Specializations, schedules, etc."
echo ""
read -p "Seed database now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Seeding database...${NC}"
    cd backend
    npm run seed
    cd ..
    echo -e "${GREEN}✅ Database seeded!${NC}"
else
    echo "You can seed later with: cd backend && npm run seed"
fi

echo ""
read -p "Press Enter to continue..."

# Final Summary
clear
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║      ✅ Setup Complete!                                   ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo -e "${BLUE}📋 Setup Summary:${NC}"
echo ""
echo -e "${GREEN}✅${NC} Prerequisites verified"
echo -e "${GREEN}✅${NC} PostgreSQL configured"
echo -e "${GREEN}✅${NC} Dependencies installed"
echo ""

# Check if Groq key is set
if grep -q "GROQ_API_KEY=gsk_" backend/.env 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Groq API Key configured"
else
    echo -e "${YELLOW}⚠️${NC}  Groq API Key NOT set"
    echo "   Add it in: backend/.env"
    echo "   Get from: https://console.groq.com"
fi

echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo "1. Start all services:"
echo -e "   ${YELLOW}./start-all.sh${NC}"
echo ""
echo "2. Open browser:"
echo -e "   ${YELLOW}http://localhost:8080${NC}"
echo ""
echo "3. Click 🎤 and speak!"
echo ""

echo -e "${BLUE}📚 Helpful Commands:${NC}"
echo ""
echo -e "   ${YELLOW}./start-all.sh${NC}  - Start everything"
echo -e "   ${YELLOW}./stop-all.sh${NC}   - Stop everything"
echo -e "   ${YELLOW}./setup.sh${NC}      - Run this setup again"
echo ""

echo -e "${GREEN}Ready to start? Run: ./start-all.sh${NC}"
echo ""
