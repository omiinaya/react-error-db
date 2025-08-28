import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

// Redis client for distributed rate limiting
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis client for distributed rate limiting
 */
export const initRedisRateLimiting = async (): Promise<void> => {
  if (config.redis.url) {
    try {
      redisClient = createClient({
        url: config.redis.url,
      });

      redisClient.on('error', (err) => {
        logger.error('Redis rate limiting client error:', err);
      });

      await redisClient.connect();
      logger.info('Redis rate limiting initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis for rate limiting:', error);
      redisClient = null;
    }
  }
};

/**
 * Get the appropriate rate limit store
 */
const getRateLimitStore = () => {
  // For now, use memory store only
  // Redis store requires additional dependency and configuration
  return undefined;
};

/**
 * Global rate limiter for all requests
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'production' ? 100 : 1000, // requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60, // 15 minutes in seconds
    },
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: getRateLimitStore(),
  keyGenerator: (req) => {
    // Use IP address + user agent for more precise rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    return `${ip}:${userAgent}`;
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60,
      },
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'production' ? 5 : 20, // 5 attempts in production
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: 15 * 60,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore(),
  keyGenerator: (req) => {
    // Use IP + endpoint for auth rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `auth:${ip}:${req.path}`;
  },
  skip: (req, res) => {
    // Skip rate limiting for successful authentication
    return req.method === 'POST' && req.path.includes('/auth/login') && res.statusCode === 200;
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString(),
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: 15 * 60,
      },
    });
  },
});

/**
 * Strict rate limiter for password reset endpoints
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.nodeEnv === 'production' ? 3 : 10, // 3 attempts per hour in production
  message: {
    success: false,
    error: {
      code: 'PASSWORD_RESET_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts, please try again later.',
      retryAfter: 60 * 60,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore(),
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `password-reset:${ip}`;
  },
});

/**
 * Rate limiter for API endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'production' ? 100 : 500, // requests per window
  message: {
    success: false,
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'Too many API requests, please try again later.',
      retryAfter: 15 * 60,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore(),
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user?.id ? `:user:${req.user.id}` : '';
    return `api:${ip}${userId}:${req.path}`;
  },
});

/**
 * Rate limiter for file uploads
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.nodeEnv === 'production' ? 10 : 50, // uploads per hour
  message: {
    success: false,
    error: {
      code: 'UPLOAD_LIMIT_EXCEEDED',
      message: 'Too many file uploads, please try again later.',
      retryAfter: 60 * 60,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore(),
});

/**
 * Rate limiter for search endpoints
 */
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.nodeEnv === 'production' ? 30 : 100, // searches per minute
  message: {
    success: false,
    error: {
      code: 'SEARCH_LIMIT_EXCEEDED',
      message: 'Too many search requests, please try again later.',
      retryAfter: 60,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore(),
});

/**
 * Rate limiter for admin endpoints
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'production' ? 50 : 200, // requests per window
  message: {
    success: false,
    error: {
      code: 'ADMIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many admin requests, please try again later.',
      retryAfter: 15 * 60,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore(),
  keyGenerator: (req) => {
    const userId = req.user?.id ? `user:${req.user.id}` : 'anonymous';
    return `admin:${userId}:${req.path}`;
  },
});

/**
 * Rate limiter for health check endpoints (more permissive)
 */
export const healthCheckRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.nodeEnv === 'production' ? 60 : 300, // 1 request per second in production
  message: {
    success: false,
    error: {
      code: 'HEALTH_CHECK_LIMIT_EXCEEDED',
      message: 'Too many health check requests.',
      retryAfter: 60,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore(),
  skip: (req) => {
    // Skip rate limiting for internal health checks
    return req.ip === '127.0.0.1' || req.ip === '::1';
  },
});

/**
 * Dynamic rate limiting based on request properties
 */
export const dynamicRateLimiter = (options: {
  windowMs: number;
  max: number;
  keyGenerator?: (req: any) => string;
  message?: any;
}) => {
  return rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    store: getRateLimitStore(),
    handler: (req, res) => {
      logger.warn('Dynamic rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        timestamp: new Date().toISOString(),
        limit: options.max,
        window: options.windowMs,
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.',
          retryAfter: Math.ceil(options.windowMs / 1000),
        },
      });
    },
  });
};

/**
 * Middleware to exempt certain endpoints from rate limiting
 */
export const rateLimitExempt = (req: any, res: any, next: any) => {
  // Exempt health checks from rate limiting
  if (req.path === '/health' || req.path.startsWith('/api/health')) {
    return next();
  }
  
  // Exempt certain API endpoints if needed
  if (req.path === '/api/metrics' && req.method === 'GET') {
    return next();
  }
  
  next();
};

/**
 * Get rate limit statistics
 */
export const getRateLimitStats = async () => {
  if (!redisClient) {
    return { store: 'memory', stats: null };
  }
  
  try {
    // Get keys pattern for rate limiting
    const keys = await redisClient.sendCommand(['KEYS', 'ratelimit:*']);
    
    return {
      store: 'redis',
      keyCount: Array.isArray(keys) ? keys.length : 0,
    };
  } catch (error) {
    logger.error('Failed to get rate limit stats:', error);
    return { store: 'redis', error: 'Failed to get stats' };
  }
};

export default {
  initRedisRateLimiting,
  globalRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  searchRateLimiter,
  adminRateLimiter,
  healthCheckRateLimiter,
  dynamicRateLimiter,
  rateLimitExempt,
  getRateLimitStats,
};