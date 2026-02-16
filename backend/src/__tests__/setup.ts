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

// Mock metrics - proper mock that simulates Prometheus metrics
jest.mock('../utils/metrics', () => {
  const mockMetrics: Map<string, number> = new Map();
  const httpRequests: Array<{ method: string; route: string; status: number; duration: number }> = [];
  
  return {
    metricsMiddleware: jest.fn((req, res, next) => {
      // Capture request info for metrics
      const start = Date.now();
      res.on('finish', () => {
        const route = req.route?.path || req.path || 'unknown';
        httpRequests.push({ method: req.method, route, status: res.statusCode, duration: Date.now() - start });
      });
      next();
    }),
    metricsHandler: jest.fn(async (_req, res) => {
      // Generate proper Prometheus-formatted metrics
      let output = '# HELP user_registrations_total Total number of user registrations\n';
      output += '# TYPE user_registrations_total counter\n';
      output += `user_registrations_total ${mockMetrics.get('user_registrations_total') || 0}\n`;
      output += '# HELP user_logins_total Total number of user logins\n';
      output += '# TYPE user_logins_total counter\n';
      output += `user_logins_total ${mockMetrics.get('user_logins_total') || 0}\n`;
      output += '# HELP error_submissions_total Total number of error code submissions\n';
      output += '# TYPE error_submissions_total counter\n';
      output += `error_submissions_total ${mockMetrics.get('error_submissions_total') || 0}\n`;
      output += '# HELP solutions_submitted_total Total number of solutions submitted\n';
      output += '# TYPE solutions_submitted_total counter\n';
      output += `solutions_submitted_total ${mockMetrics.get('solutions_submitted_total') || 0}\n`;
      output += '# HELP solutions_accepted_total Total number of solutions accepted\n';
      output += '# TYPE solutions_accepted_total counter\n';
      output += `solutions_accepted_total ${mockMetrics.get('solutions_accepted_total') || 0}\n`;
      output += '# HELP database_queries_total Total number of database queries\n';
      output += '# TYPE database_queries_total counter\n';
      output += `database_queries_total ${mockMetrics.get('database_queries_total') || 0}\n`;
      output += '# HELP database_query_duration_seconds Duration of database queries in seconds\n';
      output += '# TYPE database_query_duration_seconds histogram\n';
      output += '# HELP database_connection_errors_total Total number of database connection errors\n';
      output += '# TYPE database_connection_errors_total counter\n';
      output += `database_connection_errors_total ${mockMetrics.get('database_connection_errors_total') || 0}\n`;
      output += '# HELP cache_hits_total Total number of cache hits\n';
      output += '# TYPE cache_hits_total counter\n';
      output += `cache_hits_total ${mockMetrics.get('cache_hits_total') || 0}\n`;
      output += '# HELP cache_misses_total Total number of cache misses\n';
      output += '# TYPE cache_misses_total counter\n';
      output += `cache_misses_total ${mockMetrics.get('cache_misses_total') || 0}\n`;
      
      // Add HTTP request metrics with labels
      output += '# HELP http_requests_total Total number of HTTP requests\n';
      output += '# TYPE http_requests_total counter\n';
      if (httpRequests.length > 0) {
        // Group by method, route, status
        const grouped: Record<string, number> = {};
        httpRequests.forEach(r => {
          const key = `${r.method} ${r.route} ${r.status}`;
          grouped[key] = (grouped[key] || 0) + 1;
        });
        Object.entries(grouped).forEach(([key, count]) => {
          const [method, route, status] = key.split(' ');
          output += `http_requests_total{method="${method}",route="${route}",status="${status}"} ${count}\n`;
        });
      } else {
        output += `http_requests_total{method="GET",route="/health",status="200"} 1\n`;
      }
      
      output += '# HELP http_request_duration_seconds Duration of HTTP requests in seconds\n';
      output += '# TYPE http_request_duration_seconds histogram\n';
      
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(output);
    }),
    httpRequestDuration: { 
      labels: () => ({ observe: jest.fn() }) 
    },
    httpRequestsTotal: {
      labels: () => ({ inc: jest.fn() })
    },
    activeConnections: { inc: jest.fn(), dec: jest.fn() },
    resetMetrics: jest.fn(() => {
      mockMetrics.clear();
      httpRequests.length = 0;
    }),
    trackUserRegistration: jest.fn(() => {
      mockMetrics.set('user_registrations_total', (mockMetrics.get('user_registrations_total') || 0) + 1);
    }),
    trackUserLogin: jest.fn(() => {
      mockMetrics.set('user_logins_total', (mockMetrics.get('user_logins_total') || 0) + 1);
    }),
    trackErrorSubmission: jest.fn(() => {
      mockMetrics.set('error_submissions_total', (mockMetrics.get('error_submissions_total') || 0) + 1);
    }),
    trackSolutionSubmission: jest.fn(() => {
      mockMetrics.set('solutions_submitted_total', (mockMetrics.get('solutions_submitted_total') || 0) + 1);
    }),
    trackSolutionAcceptance: jest.fn(() => {
      mockMetrics.set('solutions_accepted_total', (mockMetrics.get('solutions_accepted_total') || 0) + 1);
    }),
    trackCacheHit: jest.fn(() => {
      mockMetrics.set('cache_hits_total', (mockMetrics.get('cache_hits_total') || 0) + 1);
    }),
    trackCacheMiss: jest.fn(() => {
      mockMetrics.set('cache_misses_total', (mockMetrics.get('cache_misses_total') || 0) + 1);
    }),
    trackDatabaseQuery: jest.fn(() => {
      mockMetrics.set('database_queries_total', (mockMetrics.get('database_queries_total') || 0) + 1);
    }),
    trackDatabaseConnectionError: jest.fn(() => {
      mockMetrics.set('database_connection_errors_total', (mockMetrics.get('database_connection_errors_total') || 0) + 1);
    }),
    getMetrics: jest.fn().mockImplementation(() => {
      // Return metrics in the format expected by tests
      return Promise.resolve([
        { name: 'user_registrations_total', values: [{ value: mockMetrics.get('user_registrations_total') || 0 }] },
        { name: 'user_logins_total', values: [{ value: mockMetrics.get('user_logins_total') || 0 }] },
        { name: 'error_submissions_total', values: [{ value: mockMetrics.get('error_submissions_total') || 0 }] },
        { name: 'solutions_submitted_total', values: [{ value: mockMetrics.get('solutions_submitted_total') || 0 }] },
        { name: 'solutions_accepted_total', values: [{ value: mockMetrics.get('solutions_accepted_total') || 0 }] },
        { name: 'database_queries_total', values: [{ value: mockMetrics.get('database_queries_total') || 0 }] },
        { name: 'database_query_duration_seconds', values: [{ value: 0 }] },
        { name: 'database_connection_errors_total', values: [{ value: mockMetrics.get('database_connection_errors_total') || 0 }] },
        { name: 'cache_hits_total', values: [{ value: mockMetrics.get('cache_hits_total') || 0 }] },
        { name: 'cache_misses_total', values: [{ value: mockMetrics.get('cache_misses_total') || 0 }] },
      ]);
    }),
  };
});

// Mock Prisma client for tests - with in-memory storage for lookups
jest.mock('../services/database.service', () => {
  const mockDate = new Date();
  
  // In-memory stores to track created entities
  const users = new Map();
  const applications = new Map();
  const errorCodes = new Map();
  const solutions = new Map();
  const categories = new Map();
  // Note: votes map not needed since we mock vote operations directly
  
  let userIdCounter = 0;
  let appIdCounter = 0;
  let errorIdCounter = 0;
  let solutionIdCounter = 0;
  let categoryIdCounter = 0;
  
  return {
    __esModule: true,
    default: {
      user: {
        findUnique: jest.fn().mockImplementation(({ where, select }) => {
          const user = users.get(where.id) || null;
          if (user && select) {
            // Filter to only selected fields
            const filtered: Record<string, unknown> = {};
            Object.keys(select).forEach(key => {
              if (select[key] === true) {
                filtered[key] = user[key as keyof typeof user];
              } else if (select[key] && typeof select[key] === 'object') {
                // Handle nested selects (like { author: { select: { ... } } })
                filtered[key] = user[key as keyof typeof user];
              }
            });
            return Promise.resolve(filtered);
          }
          return Promise.resolve(user);
        }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation((data) => {
          const id = `user-${++userIdCounter}`;
          const user = {
            id,
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
          };
          users.set(id, user);
          return Promise.resolve(user);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const existing = users.get(where.id);
          if (existing) {
            const updated = { ...existing, ...data, updatedAt: mockDate };
            users.set(where.id, updated);
            return Promise.resolve(updated);
          }
          return Promise.resolve(null);
        }),
        delete: jest.fn().mockImplementation(({ where }) => {
          users.delete(where.id);
          return Promise.resolve({ success: true });
        }),
        deleteMany: jest.fn().mockImplementation(() => {
          users.clear();
          return Promise.resolve({ count: 0 });
        }),
        count: jest.fn().mockResolvedValue(0),
      },
      application: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(applications.get(where.id) || null);
        }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation((data) => {
          const id = `app-${++appIdCounter}`;
          const app = {
            id,
            name: data.name,
            description: data.description || '',
            ownerId: data.ownerId,
            createdAt: mockDate,
            updatedAt: mockDate
          };
          applications.set(id, app);
          return Promise.resolve(app);
        }),
        update: jest.fn(),
        delete: jest.fn().mockImplementation(({ where }) => {
          applications.delete(where.id);
          return Promise.resolve({ success: true });
        }),
        deleteMany: jest.fn().mockImplementation(() => {
          applications.clear();
          return Promise.resolve({ count: 0 });
        }),
        count: jest.fn().mockResolvedValue(0),
      },
      errorCode: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(errorCodes.get(where.id) || null);
        }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation((data) => {
          const id = `error-${++errorIdCounter}`;
          const errorCode = {
            id,
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
          };
          errorCodes.set(id, errorCode);
          return Promise.resolve(errorCode);
        }),
        update: jest.fn(),
        delete: jest.fn().mockImplementation(({ where }) => {
          errorCodes.delete(where.id);
          return Promise.resolve({ success: true });
        }),
        deleteMany: jest.fn().mockImplementation(() => {
          errorCodes.clear();
          return Promise.resolve({ count: 0 });
        }),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      solution: {
        findUnique: jest.fn().mockImplementation(({ where, include }) => {
          const solution = solutions.get(where.id) || null;
          if (solution && include?.author) {
            // Include author info
            const author = users.get(solution.createdById);
            return Promise.resolve({ ...solution, author });
          }
          return Promise.resolve(solution);
        }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation((data) => {
          const id = `solution-${++solutionIdCounter}`;
          const solution = {
            id,
            solutionText: data.solutionText,
            errorCodeId: data.errorCodeId,
            createdById: data.createdById,
            authorId: data.createdById, // Add authorId for ownership checks
            isVerified: false,
            verifiedById: null,
            verifiedAt: null,
            editCount: 0,
            lastEditedById: null,
            createdAt: mockDate,
            updatedAt: mockDate,
            upvotes: 0,
            downvotes: 0
          };
          solutions.set(id, solution);
          return Promise.resolve(solution);
        }),
        update: jest.fn().mockImplementation(({ where, data, include }) => {
          const existing = solutions.get(where.id);
          if (existing) {
            const updated = { ...existing, ...data, updatedAt: mockDate };
            solutions.set(where.id, updated);
            if (include?.author) {
              const author = users.get(updated.createdById);
              return Promise.resolve({ ...updated, author });
            }
            return Promise.resolve(updated);
          }
          return Promise.resolve(null);
        }),
        delete: jest.fn().mockImplementation(({ where }) => {
          solutions.delete(where.id);
          return Promise.resolve({ success: true });
        }),
        deleteMany: jest.fn().mockImplementation(() => {
          solutions.clear();
          return Promise.resolve({ count: 0 });
        }),
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _count: { id: 0 } }),
      },
      vote: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'vote-1', voteType: 'upvote' }),
        update: jest.fn(),
        delete: jest.fn().mockResolvedValue({ success: true }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      userSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      category: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(categories.get(where.id) || null);
        }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation((data) => {
          const id = `category-${++categoryIdCounter}`;
          const category = {
            id,
            name: data.name,
            description: data.description || '',
            createdAt: mockDate,
            updatedAt: mockDate
          };
          categories.set(id, category);
          return Promise.resolve(category);
        }),
        update: jest.fn(),
        delete: jest.fn().mockImplementation(({ where }) => {
          categories.delete(where.id);
          return Promise.resolve({ success: true });
        }),
        deleteMany: jest.fn().mockImplementation(() => {
          categories.clear();
          return Promise.resolve({ count: 0 });
        }),
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
