import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Mock logger FIRST before any other imports that might use it
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  stream: {
    write: jest.fn()
  }
}));

// Mock secrets to prevent module initialization
jest.mock('../utils/secrets', () => ({
  secretManager: {
    getSecret: jest.fn(),
    setSecret: jest.fn(),
    deleteSecret: jest.fn(),
    getSecretMetadata: jest.fn(),
    getAllSecrets: jest.fn(),
    rotateSecret: jest.fn(),
    clearAll: jest.fn(),
  },
  Secrets: {
    getJwtSecret: jest.fn().mockReturnValue('test-jwt-secret'),
    getJwtRefreshSecret: jest.fn().mockReturnValue('test-refresh-secret'),
    getDatabasePassword: jest.fn().mockReturnValue('test-db-password'),
    getRedisPassword: jest.fn().mockReturnValue('test-redis-password'),
  }
}));

// Mock uptime-monitor to prevent it from starting intervals
jest.mock('../utils/uptime-monitor', () => ({
  uptimeMiddleware: jest.fn((_req, _res, next) => next()),
  UptimeMonitor: jest.fn().mockImplementation(() => ({
    recordRequest: jest.fn(),
    recordError: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({
      startTime: new Date(),
      totalUptime: 0,
      lastRestart: new Date(),
      restarts: 0,
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 }
    })
  }))
}));

// Mock metrics
jest.mock('../utils/metrics', () => ({
  metricsMiddleware: jest.fn((_req, _res, next) => next()),
  metricsHandler: jest.fn((_req, res) => res.status(200).send('mock metrics')),
  httpRequestDuration: { labels: () => ({ observe: jest.fn() }) },
  httpRequestCount: { labels: () => ({ inc: jest.fn() }) },
  activeConnections: { inc: jest.fn(), dec: jest.fn() },
  resetMetrics: jest.fn(),
  trackUserRegistration: jest.fn(),
  trackUserLogin: jest.fn(),
  trackErrorSubmission: jest.fn(),
  trackSolutionSubmission: jest.fn(),
  trackSolutionAcceptance: jest.fn(),
  trackCacheHit: jest.fn(),
  trackCacheMiss: jest.fn(),
  trackDatabaseQuery: jest.fn(),
  trackDatabaseConnectionError: jest.fn(),
  getMetrics: jest.fn().mockResolvedValue({}),
}));

// Mock Prisma client for tests
jest.mock('../services/database.service', () => {
  const mockDate = new Date();
  return {
    __esModule: true,
    default: {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn().mockImplementation((data) => Promise.resolve({
          id: `user-${Date.now()}`,
          email: data.email,
          username: data.username,
          passwordHash: data.passwordHash || 'hashed',
          role: data.role || 'user',
          isAdmin: data.isAdmin || false,
          createdAt: mockDate,
          updatedAt: mockDate,
          lastLoginAt: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
          emailVerified: false,
          themePreference: 'light'
        })),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      application: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn().mockImplementation((data) => Promise.resolve({
          id: `app-${Date.now()}`,
          name: data.name,
          description: data.description || '',
          ownerId: data.ownerId,
          createdAt: mockDate,
          updatedAt: mockDate
        })),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      errorCode: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn().mockImplementation((data) => Promise.resolve({
          id: `error-${Date.now()}`,
          code: data.code,
          title: data.title,
          description: data.description || '',
          applicationId: data.applicationId,
          categoryId: data.categoryId,
          severity: data.severity || 'medium',
          createdAt: mockDate,
          updatedAt: mockDate,
          createdById: data.createdById,
          viewCount: 0,
          lastViewedAt: null
        })),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      solution: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn().mockImplementation((data) => Promise.resolve({
          id: `solution-${Date.now()}`,
          solutionText: data.solutionText,
          errorCodeId: data.errorCodeId,
          createdById: data.createdById,
          isVerified: false,
          verifiedById: null,
          verifiedAt: null,
          editCount: 0,
          lastEditedById: null,
          createdAt: mockDate,
          updatedAt: mockDate
        })),
        update: jest.fn().mockImplementation((args) => Promise.resolve({
          id: args.where.id,
          solutionText: args.data.solutionText,
          isVerified: args.data.isVerified,
          editCount: args.data.editCount ? 1 : 0,
          updatedAt: mockDate
        })),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _count: { id: 0 } }),
      },
      vote: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn().mockImplementation((data) => Promise.resolve({
          id: `category-${Date.now()}`,
          name: data.name,
          description: data.description || '',
          createdAt: mockDate,
          updatedAt: mockDate
        })),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
      $disconnect: jest.fn(),
    },
  };
});

// Helper to generate JWT tokens for testing
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

export function getAuthToken(user: { id: string; email: string; username: string; isAdmin: boolean }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Helper to create a test user
export async function createTestUser(
  email: string = 'test@test.com',
  username: string = 'testuser',
  isAdmin: boolean = false
) {
  const prisma = require('../services/database.service').default;
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash('testpassword123', 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      isAdmin,
      role: isAdmin ? 'admin' : 'user',
      themePreference: 'light'
    },
  });
  
  return user;
}

// Helper to create a test error
export async function createTestError(applicationId?: string, categoryId?: string) {
  const prisma = require('../services/database.service').default;
  
  // Create an application if not provided
  let appId = applicationId;
  if (!appId) {
    const app = await prisma.application.create({
      data: {
        name: 'Test Application',
        description: 'Test app for error creation',
        ownerId: 'test-user-id'
      }
    });
    appId = appId || app.id;
  }
  
  let catId = categoryId;
  if (!catId) {
    const cat = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category'
      }
    });
    catId = catId || cat.id;
  }
  
  const error = await prisma.errorCode.create({
    data: {
      code: `ERR_${Date.now()}`,
      title: 'Test Error',
      description: 'Test error description',
      applicationId: appId,
      categoryId: catId,
      severity: 'medium',
      createdById: 'test-user-id'
    }
  });
  
  return error;
}

// Helper to create a test solution
export async function createTestSolution(errorCodeId: string, userId: string) {
  const prisma = require('../services/database.service').default;
  
  const solution = await prisma.solution.create({
    data: {
      solutionText: 'This is a test solution with sufficient length for validation',
      errorCodeId,
      createdById: userId
    }
  });
  
  return solution;
}

// Import app after mocks are set up
import app from '../app';

// Export prisma for tests that need direct database access
import prisma from '../services/database.service';
export { prisma };

// Export the app
export { app };

// Global test timeout
jest.setTimeout(30000);
