# React Error Database - Comprehensive Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Automated Setup](#automated-setup)
3. [Manual Setup](#manual-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Development Setup](#development-setup)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Project Structure](#project-structure)

## 🚀 Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **PostgreSQL**: 15+ (or Docker)
- **Redis**: 7+ (or Docker)
- **Git**: Latest version

### Recommended Development Tools
- **Docker & Docker Compose** (recommended for database setup)
- **Visual Studio Code** (with recommended extensions)
- **Postman** or **Insomnia** (API testing)
- **pgAdmin** or **DBeaver** (database management)

### Operating System Support
- **Windows**: 10/11 (WSL2 recommended for better performance)
- **macOS**: 10.15+ (Catalina or newer)
- **Linux**: Ubuntu 20.04+, CentOS 8+, or similar distributions

## ⚡ Automated Setup

### Using Setup Scripts

#### Unix/Linux/macOS (setup.sh)
```bash
# Make the script executable
chmod +x scripts/setup.sh

# Run the setup script
./scripts/setup.sh

# Or with specific options
./scripts/setup.sh --help
```

#### Windows (setup.bat)
```cmd
# Run the batch script
scripts\setup.bat
```

### What the Automated Setup Does
1. **Prerequisites Check**: Verifies Node.js, npm versions
2. **Environment Setup**: Creates `.env` files from examples
3. **Dependency Installation**: Installs all npm dependencies
4. **Database Setup**: 
   - Uses Docker if available (PostgreSQL + Redis)
   - Runs database migrations
   - Seeds with sample data
5. **Build Process**: Builds both frontend and backend
6. **Optional Testing**: Runs test suites

## 🛠️ Manual Setup

### Step 1: Clone and Initialize
```bash
# Clone the repository
git clone <repository-url>
cd react-error-db

# Install root dependencies
npm install
```

### Step 2: Environment Configuration
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Step 3: Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for databases to be ready
sleep 10

# Run migrations and seed
cd backend
npm run db:migrate
npm run db:seed
cd ..
```

#### Option B: Manual Database Installation
1. **Install PostgreSQL**:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS
   brew install postgresql

   # Windows: Download from https://www.postgresql.org/download/windows/
   ```

2. **Install Redis**:
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server

   # macOS
   brew install redis

   # Windows: Use WSL2 or download from https://redis.io/download/
   ```

3. **Create Database**:
   ```sql
   CREATE DATABASE errdb;
   CREATE USER errdb_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE errdb TO errdb_user;
   ```

### Step 4: Install Dependencies
```bash
# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..
```

### Step 5: Database Migrations
```bash
# Generate Prisma client
cd backend
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
cd ..
```

## 🔧 Environment Configuration

### Root .env File
```env
# Backend Environment Variables
DATABASE_URL="postgresql://user:password@localhost:5432/errdb"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-with-at-least-32-characters"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-with-at-least-32-characters"
PORT=3010
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
RATE_LIMIT_MAX=1000

# Frontend Environment Variables  
VITE_API_BASE_URL="http://localhost:3010/api"
VITE_APP_NAME="Error Database"
VITE_ENABLE_ANALYTICS="false"
VITE_ENABLE_DEBUG="false"
```

### Backend .env (backend/.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/errdb"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-with-at-least-32-characters"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-with-at-least-32-characters"

# Server
PORT=3010
NODE_ENV=development

# CORS
FRONTEND_URL="http://localhost:3000"

# Rate limiting
RATE_LIMIT_MAX=1000
```

### Frontend .env (frontend/.env)
```env
# API Configuration
VITE_API_BASE_URL="http://localhost:3001/api"
VITE_APP_NAME="Error Database"

# Feature Flags
VITE_ENABLE_ANALYTICS="false"
VITE_ENABLE_DEBUG="false"

# External Services (optional)
VITE_SENTRY_DSN=""
VITE_GOOGLE_ANALYTICS_ID=""
```

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | ❌ |
| `JWT_SECRET` | Secret for JWT token signing | - | ✅ |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | - | ✅ |
| `PORT` | Backend server port | `3010` | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` | ❌ |
| `RATE_LIMIT_MAX` | Max requests per window | `1000` | ❌ |
| `VITE_API_BASE_URL` | Frontend API base URL | `http://localhost:3001/api` | ❌ |
| `VITE_APP_NAME` | Application name | `Error Database` | ❌ |

## 🗄️ Database Setup

### Database Schema Overview
The application uses PostgreSQL with the following main tables:

- **users**: User accounts and authentication
- **categories**: Application categories (Programming Languages, Frameworks, etc.)
- **applications**: Specific applications (React, Node.js, Python, etc.)
- **error_codes**: Error codes with metadata
- **solutions**: User-contributed solutions
- **votes**: Solution voting system
- **audit_logs**: Security and activity logging

### Database Operations

#### Prisma Commands
```bash
# Generate Prisma client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name migration_name

# View database in browser
npx prisma studio

# Reset database (development only)
npx prisma migrate reset

# Seed database with sample data
npx prisma db seed
```

#### Database Management
```bash
# Backup database
npm run db:backup

# Restore from backup
npm run db:restore

# Check database health
npm run db:health
```

### Sample Data
The seed script creates:
- 2 users (admin@errdb.com/admin123, user@errdb.com/user123)
- 3 categories (Programming Languages, Web Frameworks, Databases)
- 6 applications (JavaScript, Python, React, Express.js, PostgreSQL, MongoDB)
- 6 error codes with sample solutions
- Test votes and user sessions

## 🚀 Development Setup

### Running Development Servers

#### Option A: Using Root Script (Recommended)
```bash
# Start both frontend and backend
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend
```

#### Option B: Manual Startup
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access Points
- **Frontend Application**: http://localhost:3005
- **Backend API**: http://localhost:3010
- **API Documentation**: http://localhost:3010/api/docs
- **pgAdmin** (if using Docker): http://localhost:5050 (admin@errdb.com/admin)

### Development Tools

#### Backend Debugging
```bash
# Debug mode with auto-reload
npm run dev

# Enable debug logging
DEBUG=* npm start

# Database exploration
npx prisma studio
```

#### Frontend Debugging
```bash
# Development server with hot reload
npm run dev

# React DevTools (browser extension)
# Available in Chrome/Firefox extension stores
```

## 🧪 Testing

### Test Structure
- **Backend**: Jest for unit and integration tests
- **Frontend**: Vitest for unit tests, React Testing Library
- **E2E**: Playwright for end-to-end testing

### Running Tests

#### Complete Test Suite
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage
```

#### Backend Tests
```bash
cd backend

# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- src/__tests__/auth.test.ts
```

#### Frontend Tests
```bash
cd frontend

# All tests
npm test

# UI test runner
npm run test:ui

# Coverage report
npm run test:coverage
```

#### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run for CI
npm run test:e2e:ci
```

### Test Data Setup
```bash
# Setup test database
npm run test:db:setup

# Reset test data
npm run test:db:reset

# Seed test data
npm run test:db:seed
```

## 🚀 Production Deployment

### Docker Deployment

#### Development Deployment
```bash
# Start all services
docker-compose up -d

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f
```

#### Production Deployment
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build

# With environment variables
export JWT_SECRET=$(openssl rand -base64 64)
export JWT_REFRESH_SECRET=$(openssl rand -base64 64)
docker-compose -f docker-compose.prod.yml up -d
```

#### Scaling Deployment
```bash
# For high traffic scenarios
docker-compose -f docker-compose.scale.yml up -d --build
```

### Manual Deployment

#### Backend Deployment
```bash
# Build backend
cd backend
npm run build

# Start production server
npm start

# Using PM2 (recommended)
pm2 start dist/server.js --name errdb-backend
```

#### Frontend Deployment
```bash
# Build frontend
cd frontend
npm run build

# Serve with nginx
# Copy dist/ contents to nginx web root
```

### Environment Configuration for Production

#### Production .env
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@production-db:5432/errdb_prod"
REDIS_URL="redis://production-redis:6379"
JWT_SECRET="$(openssl rand -base64 64)"
JWT_REFRESH_SECRET="$(openssl rand -base64 64)"
FRONTEND_URL="https://yourdomain.com"
```

#### Security Considerations
- Use strong, randomly generated secrets
- Enable HTTPS with valid SSL certificates
- Configure proper CORS settings
- Set up rate limiting
- Enable security headers
- Regular security audits

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U user -d errdb -c "SELECT 1;"

# Check if port is open
telnet localhost 5432
```

#### Port Conflicts
```bash
# Check port usage
sudo lsof -i :3001
sudo lsof -i :3000

# Kill processes using ports
sudo kill -9 $(lsof -t -i:3001)
sudo kill -9 $(lsof -t -i:3000)
```

#### Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Docker Issues
```bash
# Check Docker status
docker ps -a
docker logs <container_id>

# Restart Docker
sudo systemctl restart docker

# Clean up resources
docker system prune -a
```

### Performance Issues

#### High CPU Usage
```bash
# Monitor CPU usage
top -c
htop

# Identify problematic processes
ps aux --sort=-%cpu | head -10
```

#### Memory Issues
```bash
# Check memory usage
free -h

# Monitor memory trends
vmstat 1

# Increase Node.js memory limit
node --max-old-space-size=4096 server.js
```

### Logging and Monitoring

#### Application Logs
```bash
# View backend logs
tail -f /var/log/errdb/application.log

# Docker container logs
docker-compose logs -f backend

# Error patterns
grep -E "(ERROR|error|Exception)" application.log
```

#### Database Monitoring
```bash
# Check active queries
psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Identify slow queries
psql -c "SELECT query, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Monitor replication lag
psql -c "SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;"
```

## 📁 Project Structure

```
react-error-db/
├── 📁 backend/                 # Node.js backend application
│   ├── 📁 prisma/             # Database schema and migrations
│   ├── 📁 src/                # Source code
│   │   ├── 📁 config/         # Configuration management
│   │   ├── 📁 middleware/     # Express middleware
│   │   ├── 📁 routes/         # API routes
│   │   ├── 📁 services/       # Business logic
│   │   ├── 📁 utils/          # Utility functions
│   │   └── 📁 __tests__/      # Test files
│   ├── package.json           # Backend dependencies
│   └── Dockerfile.dev         # Development Dockerfile
├── 📁 frontend/               # React frontend application
│   ├── 📁 src/                # Source code
│   │   ├── 📁 components/     # React components
│   │   ├── 📁 pages/          # Page components
│   │   ├── 📁 services/       # API services
│   │   ├── 📁 types/          # TypeScript definitions
│   │   └── 📁 __tests__/      # Test files
│   ├── package.json           # Frontend dependencies
│   └── Dockerfile.dev         # Development Dockerfile
├── 📁 docker/                 # Docker configuration
│   └── 📁 postgres/           # PostgreSQL initialization scripts
├── 📁 docs/                   # Project documentation
├── 📁 monitoring/             # Monitoring configuration
├── 📁 scripts/                # Utility scripts
│   ├── setup.sh               # Unix setup script
│   ├── setup.bat              # Windows setup script
│   └── database-backup.sh     # Database backup script
├── docker-compose.yml         # Development Docker compose
├── docker-compose.prod.yml    # Production Docker compose
├── docker-compose.scale.yml   # Scaling Docker compose
├── package.json              # Root package.json
└── README.md                 # Project overview
```

### Key Files

- **docker-compose.yml**: Development environment with all services
- **docker-compose.prod.yml**: Production deployment configuration
- **docker-compose.scale.yml**: High-availability scaling configuration
- **backend/prisma/schema.prisma**: Database schema definition
- **backend/src/config/index.ts**: Environment configuration
- **frontend/vite.config.ts**: Vite build configuration

## 🤝 Support

### Getting Help
1. Check the [documentation](docs/) first
2. Search existing issues on GitHub
3. Create a new issue with detailed information

### Emergency Contacts
- **Primary Admin**: admin@errdb.com
- **Secondary Admin**: backup-admin@errdb.com
- **Emergency Pager**: +1-555-EMERGENCY

### Community Resources
- Discord/Slack channel
- GitHub Discussions
- Stack Overflow tag: `error-database`

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Happy coding! 🚀**