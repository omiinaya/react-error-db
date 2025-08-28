# Sentry Error Tracking Setup Guide

## Overview
Sentry is configured for comprehensive error tracking, performance monitoring, and alerting in the Error Database application.

## Configuration

### Environment Variables
Add the following environment variables to your `.env` file:

```bash
# Sentry DSN (get from Sentry dashboard)
SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io/your-project-id

# Environment (development, staging, production)
SENTRY_ENVIRONMENT=development
```

### Installation
Sentry packages are already included in `backend/package.json`:
- `@sentry/node` - Core Sentry SDK for Node.js
- `@sentry/profiling-node` - Performance monitoring and profiling

## Features

### Error Tracking
- Automatic capture of unhandled exceptions
- Manual error capture with context
- Error grouping and deduplication
- Rich context information (user, tags, breadcrumbs)

### Performance Monitoring
- Transaction tracing for HTTP requests
- Database query performance monitoring
- Function execution timing
- Distributed tracing support

### Alerting
- Real-time error notifications
- Performance degradation alerts
- Custom alert rules
- Integration with Slack, Email, etc.

## Usage

### Basic Error Capture
```typescript
import { captureException, captureMessage } from '../utils/sentry';

try {
  // Your code here
} catch (error) {
  captureException(error, {
    context: 'user_registration',
    userId: user.id,
  });
}

// Capture informational messages
captureMessage('User registered successfully', 'info');
```

### Performance Monitoring
```typescript
import { monitorFunction } from '../utils/sentry';

const expensiveOperation = monitorFunction(
  (data: any) => {
    // Your expensive operation
  },
  'expensive_operation'
);

// The function is now automatically monitored
const result = expensiveOperation(data);
```

### Adding Context
```typescript
import { setUserContext, addBreadcrumb } from '../utils/sentry';

// Set user context for error reports
setUserContext({
  id: user.id,
  email: user.email,
  username: user.username,
});

// Add breadcrumbs for better debugging
addBreadcrumb({
  category: 'auth',
  message: 'User authenticated',
  level: 'info',
  data: { userId: user.id },
});
```

## Integration Points

### Express Middleware
Sentry is integrated with Express through:
- `sentryRequestHandler()` - First middleware
- `sentryTracingMiddleware()` - Performance tracing
- `sentryErrorHandler()` - Error handling (last middleware)

### Database Monitoring
Prisma integration automatically tracks database queries and errors.

### Custom Error Types
Use predefined error types for better grouping:
```typescript
import { captureError, ErrorType } from '../utils/sentry';

captureError(error, ErrorType.DATABASE, {
  query: 'SELECT * FROM users',
  duration: 150, // ms
});
```

## Monitoring Dashboard

### Key Metrics to Monitor
1. **Error Rates**: Track 4xx and 5xx errors
2. **Performance**: API response times, database query times
3. **Usage**: User registrations, error submissions, solution acceptances
4. **System Health**: Memory usage, CPU utilization, database connections

### Alert Configuration
Set up alerts for:
- Error rate spikes (> 5% of requests)
- High latency (> 2 seconds P95)
- Database connection errors
- Memory leaks (> 80% memory usage)

## Troubleshooting

### Common Issues
1. **Missing DSN**: Set `SENTRY_DSN` environment variable
2. **Rate limiting**: Check Sentry quota usage
3. **Missing context**: Ensure user context is set in authenticated routes

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` and check console for Sentry initialization messages.

## Best Practices

1. **Context**: Always provide relevant context with errors
2. **Breadcrumbs**: Add breadcrumbs for complex workflows
3. **User Context**: Set user information for better debugging
4. **Performance**: Monitor critical business functions
5. **Alerting**: Set up meaningful alert thresholds

## Security Considerations

- Sensitive data is automatically filtered by Sentry
- User PII is not included in error reports by default
- Review Sentry's data processing policies for compliance

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Node.js SDK Guide](https://docs.sentry.io/platforms/node/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Alerting Configuration](https://docs.sentry.io/product/alerts/)