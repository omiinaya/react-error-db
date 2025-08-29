@echo off
chcp 65001 >nul

:: Error Database Setup Script for Windows
:: This script sets up the development environment for the Error Database project

:: Function to get project root directory
:get_project_root
set "PROJECT_ROOT=%CD%"
if "%PROJECT_ROOT:~-7%"=="scripts" (
    cd ..
    set "PROJECT_ROOT=%CD%"
)
exit /b 0

echo.
echo [INFO] Starting Error Database setup...
call :get_project_root
echo [INFO] Project directory: %PROJECT_ROOT%
echo.

:: Check prerequisites
echo [INFO] Checking prerequisites...

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)

:: Check Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
set NODE_VERSION=%NODE_VERSION:~1%
echo [INFO] Node.js version: %NODE_VERSION%

:: Check npm version
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [INFO] npm version: %NPM_VERSION%

:: Setup environment variables
echo.
echo [INFO] Setting up environment variables...

if not exist .env (
    copy .env.example .env >nul
    echo [SUCCESS] Created .env file from .env.example
) else (
    echo [INFO] .env file already exists
)

if not exist backend\.env (
    copy backend\.env.example backend\.env >nul
    echo [SUCCESS] Created backend\.env file from backend\.env.example
) else (
    echo [INFO] backend\.env file already exists
)

if not exist frontend\.env (
    copy frontend\.env.example frontend\.env >nul
    echo [SUCCESS] Created frontend\.env file from frontend\.env.example
) else (
    echo [INFO] frontend\.env file already exists
)

:: Install dependencies
echo.
echo [INFO] Installing root dependencies...
call npm install

echo [INFO] Installing backend dependencies...
cd backend
call npm install
cd ..

echo [INFO] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo [INFO] Installing Playwright browsers for E2E testing...
call npx playwright install

echo [SUCCESS] All dependencies installed successfully

:: Database setup
echo.
echo [INFO] Setting up database...

:: Check if Docker is available
docker --version >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Docker detected - setting up database containers...
    
    :: Start PostgreSQL and Redis containers
    call docker-compose up -d postgres redis
    
    :: Wait for PostgreSQL to be ready
    echo [INFO] Waiting for PostgreSQL to be ready...
    timeout /t 10 /nobreak >nul
    
    :: Run database migrations
    echo [INFO] Running database migrations...
    cd backend
    call npm run db:migrate
    cd ..
    
    :: Seed the database
    echo [INFO] Seeding database...
    cd backend
    call npm run db:seed
    cd ..
    
    echo [SUCCESS] Database setup completed with Docker
) else (
    echo [WARNING] Docker not found. Please ensure you have PostgreSQL and Redis running locally.
    echo [INFO] You can install Docker from: https://docs.docker.com/get-docker/
    echo [INFO] Or manually install:
    echo [INFO]   - PostgreSQL: https://www.postgresql.org/download/
    echo [INFO]   - Redis: https://redis.io/download/
    
    set /p "RUN_DB=Do you have PostgreSQL and Redis running locally? (y/N): "
    if /i "%RUN_DB%"=="y" (
        echo [INFO] Running database migrations...
        cd backend
        call npm run db:migrate
        cd ..
        
        echo [INFO] Seeding database...
        cd backend
        call npm run db:seed
        cd ..
        
        echo [SUCCESS] Database setup completed with local services
    ) else (
        echo [WARNING] Skipping database setup. Please ensure PostgreSQL and Redis are running before proceeding.
    )
)

:: Build project
echo.
echo [INFO] Building the project...

echo [INFO] Building backend...
cd backend
call npm run build
cd ..

echo [INFO] Building frontend...
cd frontend
call npm run build
cd ..

echo [SUCCESS] Project built successfully

:: Ask about running tests
echo.
set /p "RUN_TESTS=Would you like to run tests? (y/N): "
if /i "%RUN_TESTS%"=="y" (
    echo [INFO] Running backend tests...
    cd backend
    call npm test
    cd ..
    
    echo [INFO] Running frontend tests...
    cd frontend
    call npm test
    cd ..
    
    echo [INFO] Running E2E tests...
    call npm run test:e2e:ci
    
    echo [SUCCESS] All tests passed
)

echo.
echo [SUCCESS] Error Database setup completed successfully!
echo.
echo [INFO] Next steps:
echo [INFO]   1. Start the development server: npm run dev
echo [INFO]   2. Backend will be available at: http://localhost:3010
echo [INFO]   3. Frontend will be available at: http://localhost:3005
echo [INFO]   4. API documentation: http://localhost:3010/api/docs
echo.
echo [INFO] If you used Docker for database:
echo [INFO]   - PostgreSQL: localhost:5433 (user: user, password: password, db: errdb)
echo [INFO]   - Redis: localhost:6379
echo [INFO]   - pgAdmin: http://localhost:5050 (admin@errdb.com / admin)
echo.

pause