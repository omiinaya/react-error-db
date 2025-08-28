import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// HTTP request metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Database metrics
const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});

const databaseQueriesTotal = new client.Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'model', 'status'],
});

const databaseConnectionErrors = new client.Counter({
  name: 'database_connection_errors_total',
  help: 'Total number of database connection errors',
});

// Business metrics
const errorSubmissionsTotal = new client.Counter({
  name: 'error_submissions_total',
  help: 'Total number of error code submissions',
  labelNames: ['application'],
});

const solutionsSubmittedTotal = new client.Counter({
  name: 'solutions_submitted_total',
  help: 'Total number of solutions submitted',
  labelNames: ['error_code'],
});

const solutionsAcceptedTotal = new client.Counter({
  name: 'solutions_accepted_total',
  help: 'Total number of solutions accepted',
  labelNames: ['error_code'],
});

const userRegistrationsTotal = new client.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
});

const userLoginsTotal = new client.Counter({
  name: 'user_logins_total',
  help: 'Total number of user logins',
});

// Cache metrics
const cacheHitsTotal = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['key'],
});

const cacheMissesTotal = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['key'],
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(databaseQueryDuration);
register.registerMetric(databaseQueriesTotal);
register.registerMetric(databaseConnectionErrors);
register.registerMetric(errorSubmissionsTotal);
register.registerMetric(solutionsSubmittedTotal);
register.registerMetric(solutionsAcceptedTotal);
register.registerMetric(userRegistrationsTotal);
register.registerMetric(userLoginsTotal);
register.registerMetric(cacheHitsTotal);
register.registerMetric(cacheMissesTotal);

// Middleware to track HTTP requests
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });
  
  next();
};

// Function to track database queries
export const trackDatabaseQuery = (
  operation: string,
  model: string,
  duration: number,
  success: boolean = true
) => {
  databaseQueryDuration
    .labels(operation, model)
    .observe(duration);
  
  databaseQueriesTotal
    .labels(operation, model, success ? 'success' : 'error')
    .inc();
};

// Function to track database connection errors
export const trackDatabaseConnectionError = () => {
  databaseConnectionErrors.inc();
};

// Function to track business metrics
export const trackErrorSubmission = (application: string) => {
  errorSubmissionsTotal.labels(application).inc();
};

export const trackSolutionSubmission = (errorCode: string) => {
  solutionsSubmittedTotal.labels(errorCode).inc();
};

export const trackSolutionAcceptance = (errorCode: string) => {
  solutionsAcceptedTotal.labels(errorCode).inc();
};

export const trackUserRegistration = () => {
  userRegistrationsTotal.inc();
};

export const trackUserLogin = () => {
  userLoginsTotal.inc();
};

// Function to track cache metrics
export const trackCacheHit = (key: string) => {
  cacheHitsTotal.labels(key).inc();
};

export const trackCacheMiss = (key: string) => {
  cacheMissesTotal.labels(key).inc();
};

// Metrics endpoint handler
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error generating metrics');
  }
};

// Get all metrics as JSON
export const getMetrics = async () => {
  return register.getMetricsAsJSON();
};

// Reset all metrics (for testing)
export const resetMetrics = () => {
  register.resetMetrics();
};

export default {
  register,
  metricsMiddleware,
  trackDatabaseQuery,
  trackDatabaseConnectionError,
  trackErrorSubmission,
  trackSolutionSubmission,
  trackSolutionAcceptance,
  trackUserRegistration,
  trackUserLogin,
  trackCacheHit,
  trackCacheMiss,
  metricsHandler,
  getMetrics,
  resetMetrics,
};