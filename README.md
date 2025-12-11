# Simplify for India

Auto-apply to jobs on Indian job portals with this Chrome extension and backend API.

## Quick Start

### Automated Setup

```bash
./scripts/setup.sh
```

### Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   # Edit apps/backend/.env with your database credentials
   ```

3. **Set up PostgreSQL database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE simplify_india;"
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Run the services:**
   ```bash
   # Backend (Terminal 1)
   cd apps/backend && npm run start:dev

   # Extension (Terminal 2)
   cd apps/extension && npm run dev
   ```

## Documentation

See **[SETUP.md](./SETUP.md)** for detailed setup instructions, troubleshooting, and development workflow.

## Project Structure

- **`apps/backend/`** - NestJS API server with PostgreSQL
- **`apps/extension/`** - Chrome extension (React + Vite)

## Tech Stack

- **Backend:** NestJS, TypeORM, PostgreSQL, JWT Authentication
- **Extension:** React, TypeScript, Vite, Chrome Extension Manifest V3

## Key Features

- User authentication with JWT
- Auto-fill job applications
- Chrome extension with popup interface
- Content scripts for job portal automation

## Requirements

- Node.js v16+ (v12.22.9 currently used, upgrade recommended)
- PostgreSQL 12+
- Chrome browser (for extension)

## Development Commands

```bash
# Install dependencies
npm install

# Build all workspaces
npm run build

# Lint code
npm run lint

# Run tests
npm run test

# Backend dev server
cd apps/backend && npm run start:dev

# Extension dev build
cd apps/extension && npm run dev
```

## License

UNLICENSED
