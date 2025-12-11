#!/bin/bash

# Simplify for India - Quick Setup Script
# This script helps you set up the project for local development

set -e  # Exit on error

echo "🚀 Simplify for India - Setup Script"
echo "===================================="
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "⚠️  Warning: Node.js version is $NODE_VERSION, but v16+ is recommended"
    echo "   You may encounter issues with some packages (especially 'pg')"
    echo "   Consider upgrading: https://nodejs.org/"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check if .env exists
if [ ! -f "apps/backend/.env" ]; then
    echo "📝 Creating backend .env file..."

    # Prompt for database URL
    echo "Please provide your PostgreSQL database information:"
    read -p "Database host (default: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    read -p "Database port (default: 5432): " DB_PORT
    DB_PORT=${DB_PORT:-5432}

    read -p "Database user (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}

    read -sp "Database password: " DB_PASS
    echo ""

    read -p "Database name (default: simplify_india): " DB_NAME
    DB_NAME=${DB_NAME:-simplify_india}

    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-secret-$(date +%s)")

    # Create .env file
    cat > apps/backend/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}

# Server Configuration
PORT=3000
NODE_ENV=development
EOF

    echo "✅ .env file created at apps/backend/.env"
else
    echo "✅ .env file already exists at apps/backend/.env"
fi
echo ""

# Build project
echo "🔨 Building project..."
npm run build
echo "✅ Build complete"
echo ""

# Success message
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure PostgreSQL is running"
echo "2. Create database: psql -U postgres -c 'CREATE DATABASE simplify_india;'"
echo "3. Start backend: cd apps/backend && npm run start:dev"
echo "4. Start extension: cd apps/extension && npm run dev"
echo ""
echo "For more details, see SETUP.md"
