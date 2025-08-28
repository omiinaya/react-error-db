# Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying the Error Database application across different environments (development, staging, production) with best practices for security, scalability, and reliability.

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **PostgreSQL**: 15.x or higher
- **Redis**: 7.x or higher
- **Docker**: 20.x or higher (optional)
- **Memory**: 2GB RAM minimum, 4GB+ recommended
- **Storage**: 10GB+ disk space
- **CPU**: 2+ cores

### Dependencies
```bash
# Core dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Development tools
npm install -g concurrently
```

## Environment Setup

### Environment Variables
Create environment files for each environment:

#### .env.development
```env
# Node Environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/errdb_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_IDLE_TIMEOUT=10000
DATABASE_CONNECTION_TIMEOUT=2000

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-development-jwt-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-development-refresh-secret-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application
PORT=3010
FRONTEND_URL=http://localhost:3005
API_BASE_URL=http://localhost:3010/api

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/application.log

# Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW_MS=900000
```

#### .env.production
```env
# Node Environment
NODE_ENV=production

# Database  
DATABASE_URL=postgresql://user:password@production-db:5432/errdb_prod
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=5000

# Redis
REDIS_URL=redis://production-redis:6379

# JWT - Generate strong secrets for production
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application
PORT=3010
FRONTEND_URL=https://yourdomain.com
API_BASE_URL=https://api.yourdomain.com/api

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/errdb/application.log

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Security
CORS_ORIGIN=https://yourdomain.com
HELMET_ENABLED=true
COMPRESSION_ENABLED=true

# Monitoring
PROMETHEUS_METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
```

## Deployment Methods

### 1. Docker Deployment (Recommended)

#### Production Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3010
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3010/api/health || exit 1

CMD ["npm", "start"]
```

#### Docker Compose (Production)
```yaml
# docker-compose.production.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: errdb-postgres-prod
    environment:
      POSTGRES_DB: errdb_prod
      POSTGRES_USER: errdb_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_HOST_AUTH_METHOD: scram-sha-256
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - errdb-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: errdb-redis-prod
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - errdb-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: errdb-backend-prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://errdb_user:${DB_PASSWORD}@postgres:5432/errdb_prod
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    ports:
      - "3010:3010"
    depends_on:
      - postgres
      - redis
    networks:
      - errdb-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3010/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: errdb-frontend-prod
    environment:
      - VITE_API_BASE_URL=https://api.yourdomain.com/api
      - VITE_APP_NAME=Error Database
    ports:
      - "3005:3005"
    depends_on:
      - backend
    networks:
      - errdb-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  errdb-network:
    driver: bridge
```

#### Deployment Commands
```bash
# Build and start
docker-compose -f docker-compose.production.yml up -d --build

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop services
docker-compose -f docker-compose.production.yml down

# Update deployment
docker-compose -f docker-compose.production.yml up -d --build --force-recreate
```

### 2. Manual Deployment

#### Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Redis
sudo apt-get install -y redis-server

# Install PM2
sudo npm install -g pm2
```

#### Database Setup
```bash
# Create database and user
sudo -u postgres psql -c "CREATE DATABASE errdb_prod;"
sudo -u postgres psql -c "CREATE USER errdb_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE errdb_prod TO errdb_user;"

# Run migrations
cd backend
npm run db:migrate
npm run db:seed
```

#### Application Deployment
```bash
# Build application
npm run build:backend
npm run build:frontend

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

#### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'errdb-backend',
    script: './backend/dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3010
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }, {
    name: 'errdb-frontend',
    script: 'serve',
    args: ['-s', 'frontend/dist', '-l', '3005'],
    instances: 1,
    env: {
      PM2_SERVE_PATH: './frontend/dist',
      PM2_SERVE_PORT: 3005,
      PM2_SERVE_SPA: 'true'
    }
  }]
};
```

### 3. Cloud Deployment (AWS Example)

#### ECS Task Definition
```json
{
  "family": "errdb-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account-id:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-ecr-repo/errdb-backend:latest",
      "essential": true,
      "portMappings": [{"containerPort": 3010, "protocol": "tcp"}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DATABASE_URL", "value": "postgresql://user:pass@rds-endpoint:5432/errdb"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/errdb",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

#### Deployment Script
```bash
#!/bin/bash
# deploy.sh

# Build and push Docker images
docker build -t errdb-backend:latest ./backend
docker build -t errdb-frontend:latest ./frontend

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin account-id.dkr.ecr.us-east-1.amazonaws.com
docker tag errdb-backend:latest account-id.dkr.ecr.us-east-1.amazonaws.com/errdb-backend:latest
docker push account-id.dkr.ecr.us-east-1.amazonaws.com/errdb-backend:latest

# Update ECS service
aws ecs update-service --cluster errdb-cluster --service errdb-service --force-new-deployment
```

## SSL/TLS Configuration

### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/errdb
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Backend API
    location / {
        proxy_pass http://localhost:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Database Setup

### Production Database Configuration
```sql
-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Configure database parameters
ALTER DATABASE errdb_prod SET work_mem = '16MB';
ALTER DATABASE errdb_prod SET maintenance_work_mem = '64MB';
ALTER DATABASE errdb_prod SET random_page_cost = 1.1;
ALTER DATABASE errdb_prod SET effective_cache_size = '4GB';

-- Create read-only user for analytics
CREATE USER read_only_user WITH PASSWORD 'secure_readonly_password';
GRANT CONNECT ON DATABASE errdb_prod TO read_only_user;
GRANT USAGE ON SCHEMA public TO read_only_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only_user;
```

### Database Backup Strategy
```bash
#!/bin/bash
# backup.sh

# Daily backup
pg_dump -Fc -Z 9 errdb_prod > /backups/errdb-$(date +%Y%m%d).dump

# Encrypt backup
openssl enc -aes-256-cbc -salt -in /backups/errdb-$(date +%Y%m%d).dump -out /backups/errdb-$(date +%Y%m%d).enc -pass pass:${BACKUP_PASSWORD}

# Upload to S3
aws s3 cp /backups/errdb-$(date +%Y%m%d).enc s3://your-backup-bucket/

# Cleanup old backups (keep 7 days)
find /backups -name "errdb-*.enc" -mtime +7 -delete
```

## Monitoring and Logging

### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'errdb-backend'
    static_configs:
      - targets: ['localhost:3010']
    metrics_path: '/api/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']
```

### Health Checks
```bash
# Application health
curl -f https://api.yourdomain.com/api/health

# Database health
curl -f https://api.yourdomain.com/api/health/database

# Redis health  
curl -f https://api.yourdomain.com/api/health/redis
```

## Security Hardening

### System Security
```bash
# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Install fail2ban
sudo apt-get install fail2ban

# Automatic security updates
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Application Security
```bash
# Regular dependency updates
npm audit fix
npm update

# Security scanning
npm audit
npx snyk test
```

## Scaling Strategies

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
    environment:
      - INSTANCE_ID=${HOSTNAME}

  frontend:
    deploy:
      replicas: 2
    environment:
      - LOAD_BALANCER_ENABLED=true
```

### Database Scaling
```sql
-- Read replicas
CREATE PUBLICATION errdb_publication FOR ALL TABLES;
CREATE SUBSCRIPTION errdb_replica_subscription
CONNECTION 'host=replica-server dbname=errdb_prod user=replica_user'
PUBLICATION errdb_publication;
```

## Rollback Procedures

### Database Rollback
```bash
# Restore from backup
pg_restore -d errdb_prod /backups/errdb-20231201.dump

# Check data consistency
psql -d errdb_prod -c "SELECT COUNT(*) FROM users;"
```

### Application Rollback
```bash
# Revert to previous Docker image
docker-compose -f docker-compose.production.yml up -d --force-recreate --no-build backend:previous-version

# PM2 rollback
pm2 deploy ecosystem.config.js production revert 1
```

## Maintenance Tasks

### Regular Maintenance
```bash
# Database maintenance
psql -d errdb_prod -c "VACUUM ANALYZE;"

# Log rotation
logrotate /etc/logrotate.d/errdb

# Backup verification
pg_restore --list /backups/errdb-latest.dump | head -10
```

### Monitoring Tasks
```bash
# Check disk space
df -h

# Monitor memory usage
free -h

# Check application status
pm2 status

# Review logs
tail -f /var/log/errdb/application.log
```

This deployment guide provides comprehensive instructions for setting up the Error Database application in various environments with best practices for security, scalability, and maintainability.