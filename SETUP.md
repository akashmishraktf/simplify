# Simplify for India - Local Setup Guide

This is a monorepo containing a NestJS backend and a Chrome extension for auto-applying to jobs on Indian portals.

## Prerequisites

### Required Software

1. **Node.js v16 or higher** (Currently running v12.22.9 - upgrade recommended)
   ```bash
   # Check your version
   node --version

   # Install Node v16+ from https://nodejs.org/
   # Or use nvm:
   nvm install 16
   nvm use 16
   ```

2. **PostgreSQL Database**
   - Install PostgreSQL: https://www.postgresql.org/download/
   - Or use Docker:
     ```bash
     docker run --name simplify-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
     ```

3. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

## Initial Setup

### 1. Clone and Install Dependencies

```bash
cd /home/akash/Documents/Github/simplify-for-india

# Install all workspace dependencies
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Using psql
psql -U postgres
CREATE DATABASE simplify_india;
\q
```

Or with Docker:
```bash
docker exec -it simplify-postgres psql -U postgres -c "CREATE DATABASE simplify_india;"
```

### 3. Environment Configuration

Create environment file for the backend:

```bash
# Create .env file in backend directory
cat > apps/backend/.env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/simplify_india
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3000
EOF
```

**Important:** Update the DATABASE_URL with your actual PostgreSQL credentials:
- Format: `postgresql://username:password@host:port/database`
- Example: `postgresql://myuser:mypassword@localhost:5432/simplify_india`

### 4. Build the Project

```bash
# Build all workspaces
npm run build
```

## Running the Application

### Backend (NestJS API)

```bash
# Development mode with hot-reload
cd apps/backend
npm run start:dev

# Or production mode
npm run start:prod
```

The backend will run on **http://localhost:3000**

**Available endpoints:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /v1/profile` - Get user profile (requires JWT token)

### Extension (Chrome Extension)

#### Development Mode

```bash
# Start Vite dev server
cd apps/extension
npm run dev
```

#### Production Build

```bash
# Build the extension
cd apps/extension
npm run build
```

The built extension will be in `apps/extension/dist/`

### Load Extension in Chrome

1. Build the extension (see above)
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `apps/extension/dist` folder
6. The extension should now appear in your Chrome toolbar

## Development Workflow

### Running Everything

```bash
# Terminal 1: Start backend in dev mode
cd apps/backend && npm run start:dev

# Terminal 2: Start extension in dev mode
cd apps/extension && npm run dev

# Terminal 3 (optional): Run tests
npm run test --workspaces
```

### Code Quality

```bash
# Run linting (auto-fixes issues)
npm run lint

# Run tests
npm run test

# Format code
cd apps/backend && npm run format
```

## Database Management

The backend uses TypeORM with `synchronize: true`, which automatically creates/updates database tables based on entities. This is convenient for development but **should be disabled in production**.

**Entities:**
- `User` - User authentication data
- `UserProfile` - User profile information

To reset the database:
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE simplify_india;"
psql -U postgres -c "CREATE DATABASE simplify_india;"

# Restart backend - tables will be auto-created
```

## Project Structure

```
simplify-for-india/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── src/
│   │   │   ├── auth/     # Authentication module (JWT)
│   │   │   ├── users/    # Users module
│   │   │   └── main.ts   # Entry point
│   │   └── package.json
│   └── extension/        # Chrome extension
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── popup.tsx    # Extension popup
│       │   └── content.ts   # Content script
│       ├── manifest.json
│       └── package.json
├── package.json          # Root workspace config
└── node_modules/
```

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   # or
   docker ps | grep postgres
   ```

2. Test connection:
   ```bash
   psql -U postgres -d simplify_india
   ```

3. Check DATABASE_URL in `apps/backend/.env`

### Node Version Warning

If you see "EBADENGINE Unsupported engine" for `pg` package:
```bash
# Upgrade to Node v16+
nvm install 16
nvm use 16
npm install
```

### Extension Not Loading

1. Make sure you built the extension: `npm run build`
2. Check that `manifest.json` is in the `dist` folder
3. Look for errors in `chrome://extensions/` with Developer mode enabled
4. Check browser console for errors

### TypeScript Errors

```bash
# Check for type errors
cd apps/backend && npx tsc --noEmit
cd apps/extension && npx tsc --noEmit
```

## API Testing

You can test the API with curl or Postman:

```bash
# Register a new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (use token from login response)
curl http://localhost:3000/v1/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Next Steps

1. Update DATABASE_URL in production environment
2. Change JWT_SECRET to a secure random string
3. Set up proper CORS configuration in backend
4. Add API URL configuration for extension to connect to backend
5. Disable TypeORM `synchronize` in production and use migrations
6. Set up proper logging and error handling
7. Add rate limiting and security headers

## Additional Commands

```bash
# Clean build artifacts
npm run prebuild --workspaces

# Run specific workspace command
npm run build -w apps/backend
npm run dev -w apps/extension

# Install package in specific workspace
npm install <package> -w apps/backend
```
