# Multi-stage build for production
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    tzdata

# Set timezone
ENV TZ=UTC

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install root dependencies
RUN npm ci --only=production --ignore-scripts

# Backend build stage
FROM base AS backend-builder

WORKDIR /app/backend

# Install backend dependencies
RUN npm ci --only=production --ignore-scripts

# Copy backend source code
COPY backend/ ./

# Build backend
RUN npm run build

# Frontend build stage
FROM base AS frontend-builder

WORKDIR /app/frontend

# Install frontend dependencies
RUN npm ci --only=production --ignore-scripts

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Production stage
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy backend
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/package*.json ./backend/
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/prisma ./backend/prisma

# Copy frontend
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/dist ./frontend/dist
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/package*.json ./frontend/

# Install production dependencies
WORKDIR /app/backend
RUN npm ci --only=production --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3001
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Default command (can be overridden)
CMD ["npm", "start", "--prefix", "backend"]