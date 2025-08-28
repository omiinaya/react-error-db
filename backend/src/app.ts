import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
// rateLimit is used in middleware files, not directly here

import { config } from './config';
import { errorMiddleware } from './middleware/error.middleware';
import {
  securityMiddleware,
  additionalSecurityHeaders,
  securityLoggingMiddleware
} from './middleware/security.middleware';
import {
  globalRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  adminRateLimiter,
  healthCheckRateLimiter,
  rateLimitExempt
} from './middleware/rate-limiting.middleware';
import { stream } from './utils/logger';
import { metricsMiddleware } from './utils/metrics';
import { sentryRequestHandler, sentryTracingMiddleware, sentryErrorHandler } from './utils/sentry';
import { addRequestContext } from './utils/log-aggregation';
import { uptimeMiddleware } from './utils/uptime-monitor';
import routes from './routes';

const app = express();

// Sentry request handler (must be first)
app.use(sentryRequestHandler);

// Sentry tracing middleware
app.use(sentryTracingMiddleware);

// Security middleware (must be early in the chain)
app.use(securityMiddleware);
app.use(additionalSecurityHeaders);
app.use(securityLoggingMiddleware);

// Log aggregation context middleware
app.use(addRequestContext);

// Uptime monitoring middleware
app.use(uptimeMiddleware);

// Helmet security headers (complementary to our custom security middleware)
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Rate limiting exemptions
app.use(rateLimitExempt);

// Global rate limiting
app.use(globalRateLimiter);

// Specific rate limiters for different endpoints
app.use('/api/auth', authRateLimiter);
app.use('/api', apiRateLimiter);
app.use('/api/admin', adminRateLimiter);
app.use('/health', healthCheckRateLimiter);
app.use('/api/health', healthCheckRateLimiter);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Metrics middleware (must be before other middleware)
app.use(metricsMiddleware);

// Logging middleware
app.use(morgan('combined', { stream }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv 
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handling middleware (must be last)
app.use(sentryErrorHandler);
app.use(errorMiddleware);

export default app;