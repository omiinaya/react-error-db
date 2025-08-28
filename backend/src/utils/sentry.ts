import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from '../config';
// import type { SentryEvent } from '@sentry/types';

/**
 * Sentry error tracking and monitoring configuration
 */

// Initialize Sentry
export const initSentry = () => {
  if (!config.sentry.dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    release: `error-database@${process.env.npm_package_version || '1.0.0'}`,
    
    // Performance monitoring
    integrations: [
      nodeProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: require('../app') }),
      new Sentry.Integrations.Prisma({ client: require('@prisma/client') }),
    ],

    // Tracing configuration
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
    profilesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,

    // Filter out health check endpoints
    beforeSend: (event: any) => {
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    },

    // Debug mode in development
    debug: config.nodeEnv === 'development',
  });
};

// Capture exceptions
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.withScope((scope: any) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

// Capture messages
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Set user context
export const setUserContext = (user: {
  id: string | number;
  email?: string;
  username?: string;
  ip_address?: string;
}) => {
  Sentry.setUser(user);
};

// Clear user context
export const clearUserContext = () => {
  Sentry.setUser(null);
};

// Add breadcrumbs
export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};

// Performance monitoring - start transaction
export const startTransaction = (name: string, context?: Partial<Sentry.TransactionContext>) => {
  return Sentry.startTransaction({
    name,
    ...context,
  });
};

// Performance monitoring - get current transaction
export const getCurrentTransaction = () => {
  return Sentry.getCurrentHub().getScope()?.getTransaction();
};

// Flush events (useful for serverless environments)
export const flushSentry = async (timeout?: number) => {
  return Sentry.flush(timeout);
};

// Close Sentry
export const closeSentry = async () => {
  return Sentry.close();
};

// Error handler middleware for Express
export const sentryErrorHandler = Sentry.Handlers.errorHandler();

// Request handler middleware for Express
export const sentryRequestHandler = Sentry.Handlers.requestHandler();

// Tracing handler middleware for Express
export const sentryTracingMiddleware = Sentry.Handlers.tracingHandler();

// Custom error types for better grouping
export enum ErrorType {
  DATABASE = 'database_error',
  VALIDATION = 'validation_error',
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  NETWORK = 'network_error',
  THIRD_PARTY = 'third_party_error',
  INTERNAL = 'internal_error',
}

// Enhanced error capture with type
export const captureError = (
  error: Error,
  type: ErrorType = ErrorType.INTERNAL,
  context?: Record<string, any>
) => {
  Sentry.withScope((scope: any) => {
    scope.setTag('error_type', type);
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

// Monitor function execution
export const monitorFunction = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const transaction = startTransaction(`function:${name}`);
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result
          .then((res) => {
            transaction.finish();
            return res;
          })
          .catch((error) => {
            transaction.setStatus('internal_error');
            transaction.finish();
            captureException(error, { function: name });
            throw error;
          }) as ReturnType<T>;
      } else {
        transaction.finish();
        return result;
      }
    } catch (error) {
      transaction.setStatus('internal_error');
      transaction.finish();
      captureException(error as Error, { function: name });
      throw error;
    }
  }) as T;
};

export default {
  initSentry,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  startTransaction,
  getCurrentTransaction,
  flushSentry,
  closeSentry,
  sentryErrorHandler,
  sentryRequestHandler,
  sentryTracingMiddleware,
  captureError,
  monitorFunction,
  ErrorType,
};