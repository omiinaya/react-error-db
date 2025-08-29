#!/bin/bash

# Error Database Setup Script
# This script sets up the development environment for the Error Database project
# Compatible with both Unix systems and Windows (via WSL, Git Bash, or Cygwin)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Windows
is_windows() {
    case "$(uname -s)" in
        CYGWIN*|MINGW32*|MSYS*|MINGW*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    local required_version="18.0.0"
    local node_version=$(node -v | sed 's/v//')
    
    if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" = "$required_version" ]; then
        log_success "Node.js version $node_version meets requirement (>= $required_version)"
    else
        log_error "Node.js version $node_version is below required version $required_version"
        exit 1
    fi
}

# Function to check npm version
check_npm_version() {
    local required_version="8.0.0"
    local npm_version=$(npm -v)
    
    if [ "$(printf '%s\n' "$required_version" "$npm_version" | sort -V | head -n1)" = "$required_version" ]; then
        log_success "npm version $npm_version meets requirement (>= $required_version)"
    else
        log_error "npm version $npm_version is below required version $required_version"
        exit 1
    fi
}

# Function to setup environment variables
setup_env_variables() {
    log_info "Setting up environment variables..."
    
    # Copy .env.example files if they don't exist
    if [ ! -f .env ]; then
        cp .env.example .env
        log_success "Created .env file from .env.example"
    else
        log_info ".env file already exists"
    fi
    
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        log_success "Created backend/.env file from backend/.env.example"
    else
        log_info "backend/.env file already exists"
    fi
    
    if [ ! -f frontend/.env ]; then
        cp frontend/.env.example frontend/.env
        log_success "Created frontend/.env file from frontend/.env.example"
    else
        log_info "frontend/.env file already exists"
    fi
    
    # Generate secure JWT secrets if they're still the default values
    if grep -q "your-super-secret-jwt-key" backend/.env; then
        log_info "Generating secure JWT secrets..."
        local jwt_secret=$(openssl rand -base64 32)
        local refresh_secret=$(openssl rand -base64 32)
        
        if is_windows; then
            # Windows sed compatibility
            sed -i "s|JWT_SECRET=.*|JWT_SECRET=\"$jwt_secret\"|" backend/.env
            sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=\"$refresh_secret\"|" backend/.env
        else
            # Unix sed
            sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=\"$jwt_secret\"|" backend/.env
            sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=\"$refresh_secret\"|" backend/.env
        fi
        
        log_success "Generated secure JWT secrets"
    fi
}

# Function to install dependencies
install_dependencies() {
    log_info "Installing root dependencies..."
    npm install
    
    log_info "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    log_info "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    log_info "Installing Playwright browsers for E2E testing..."
    npx playwright install
    
    log_success "All dependencies installed successfully"
}

# Function to setup database
setup_database() {
    log_info "Setting up database..."
    
    # Check if Docker is available
    if command_exists docker; then
        log_info "Docker detected - setting up database containers..."
        
        # Start PostgreSQL and Redis containers
        docker-compose up -d postgres redis
        
        # Wait for PostgreSQL to be ready
        log_info "Waiting for PostgreSQL to be ready..."
        sleep 10
        
        # Run database migrations
        log_info "Running database migrations..."
        cd backend && npm run db:migrate && cd ..
        
        # Seed the database
        log_info "Seeding database..."
        cd backend && npm run db:seed && cd ..
        
        log_success "Database setup completed with Docker"
    else
        log_warning "Docker not found. Please ensure you have PostgreSQL and Redis running locally."
        log_info "You can install Docker from: https://docs.docker.com/get-docker/"
        log_info "Or manually install:"
        log_info "  - PostgreSQL: https://www.postgresql.org/download/"
        log_info "  - Redis: https://redis.io/download/"
        
        read -p "Do you have PostgreSQL and Redis running locally? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Running database migrations..."
            cd backend && npm run db:migrate && cd ..
            
            log_info "Seeding database..."
            cd backend && npm run db:seed && cd ..
            
            log_success "Database setup completed with local services"
        else
            log_warning "Skipping database setup. Please ensure PostgreSQL and Redis are running before proceeding."
        fi
    fi
}

# Function to build the project
build_project() {
    log_info "Building the project..."
    
    log_info "Building backend..."
    cd backend && npm run build && cd ..
    
    log_info "Building frontend..."
    cd frontend && npm run build && cd ..
    
    log_success "Project built successfully"
}

# Function to run tests
run_tests() {
    log_info "Running tests..."
    
    log_info "Running backend tests..."
    cd backend && npm test && cd ..
    
    log_info "Running frontend tests..."
    cd frontend && npm test && cd ..
    
    log_info "Running E2E tests..."
    npm run test:e2e:ci
    
    log_success "All tests passed"
}

# Function to show help
show_help() {
    echo -e "${GREEN}Error Database Setup Script${NC}"
    echo "================================="
    echo "Usage: $0 [--help]"
    echo ""
    echo "Options:"
    echo "  --help    Show this help message"
    echo ""
    echo "This script sets up the development environment for the Error Database project."
    echo "It will:"
    echo "  - Check prerequisites (Node.js, npm)"
    echo "  - Set up environment variables"
    echo "  - Install dependencies"
    echo "  - Set up database (using Docker if available)"
    echo "  - Build the project"
    echo "  - Optionally run tests"
    echo ""
    echo "For Windows users, use setup.bat instead."
}

# Function to get project root directory
get_project_root() {
    # If we're in the scripts directory, go up one level
    if [ "$(basename "$(pwd)")" = "scripts" ]; then
        cd ..
    fi
    echo "$(pwd)"
}

# Main execution
main() {
    # Ensure we're in the project root directory
    PROJECT_ROOT=$(get_project_root)
    cd "$PROJECT_ROOT"
    
    log_info "Starting Error Database setup..."
    log_info "Project directory: $PROJECT_ROOT"
    
    # Check prerequisites
    log_info "Checking prerequisites..."
    
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    if ! command_exists npm; then
        log_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    check_node_version
    check_npm_version
    
    # Setup environment variables
    setup_env_variables
    
    # Install dependencies
    install_dependencies
    
    # Setup database
    setup_database
    
    # Build project
    build_project
    
    # Run tests
    read -p "Would you like to run tests? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    log_success "🎉 Error Database setup completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Start the development server: npm run dev"
    log_info "  2. Backend will be available at: http://localhost:3010"
    log_info "  3. Frontend will be available at: http://localhost:3005"
    log_info "  4. API documentation: http://localhost:3010/api/docs"
    log_info ""
    log_info "If you used Docker for database:"
    log_info "  - PostgreSQL: localhost:5433 (user: user, password: password, db: errdb)"
    log_info "  - Redis: localhost:6379"
    log_info "  - pgAdmin: http://localhost:5050 (admin@errdb.com / admin)"
}

# Handle script interruption
trap 'log_error "Setup interrupted by user"; exit 1' INT

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main "$@"