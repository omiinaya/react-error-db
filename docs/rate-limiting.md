# Rate Limiting Configuration Guide

## Overview
The Error Database application implements comprehensive rate limiting to protect against abuse, DDoS attacks, and ensure fair usage of API resources. The system uses a multi-layered approach with different limits for various types of endpoints.

## Rate Limiting Strategies

### 1. Global Rate Limiting
**Applies to**: All requests
- **Window**: 15 minutes
- **Limit**: 100 requests (production) / 1000 requests (development)
- **Purpose**: Basic protection against abuse

### 2. Authentication Rate Limiting  
**Applies to**: `/api/auth/*` endpoints
- **Window**: 15 minutes
- **Limit**: 5 attempts (production) / 20 attempts (development)
- **Purpose**: Prevent brute force attacks on authentication

### 3. API Rate Limiting
**Applies to**: All `/api/*` endpoints (except auth)
- **Window**: 15 minutes
- **Limit**: 100 requests (production) / 500 requests (development)
- **Purpose**: Protect API resources from overuse

### 4. Admin Rate Limiting
**Applies to**: `/api/admin/*` endpoints
- **Window**: 15 minutes
- **Limit**: 50 requests (production) / 200 requests (development)
- **Purpose**: Protect administrative functions

### 5. Health Check Rate Limiting
**Applies to**: `/health` and `/api/health` endpoints
- **Window**: 1 minute
- **Limit**: 60 requests (production) / 300 requests (development)
- **Purpose**: Prevent health check abuse while allowing monitoring

## Configuration

### Environment Variables
```bash
# Global rate limit (requests per 15 minutes)
RATE_LIMIT_MAX=1000

# Redis URL for distributed rate limiting (optional)
REDIS_URL=redis://localhost:6379
```

### Rate Limit Store
- **Memory Store**: Default for development and single-instance deployments
- **Redis Store**: Recommended for production and multi-instance deployments
- **Automatic Fallback**: Falls back to memory store if Redis is unavailable

## Response Format

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests from this IP, please try again later.",
    "retryAfter": 900
  }
}
```

### Headers Included
```http
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1698765432
Retry-After: 900
```

## Customization

### Per-Endpoint Configuration
```typescript
// Custom rate limiter for specific endpoint
export const customRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: {
      code: 'CUSTOM_LIMIT_EXCEEDED',
      message: 'Custom rate limit exceeded',
      retryAfter: 60,
    },
  },
});
```

### Dynamic Rate Limiting
```typescript
// Dynamic rate limiting based on user role
export const dynamicUserRateLimiter = (req, res, next) => {
  const userLimit = req.user?.isPremium ? 1000 : 100;
  
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: userLimit,
    // ... other options
  })(req, res, next);
};
```

## Exemptions

### Exempt Endpoints
- Internal health checks (localhost)
- Certain monitoring endpoints
- Emergency access routes

### Exemption Middleware
```typescript
export const rateLimitExempt = (req, res, next) => {
  // Exempt health checks
  if (req.path === '/health' || req.path.startsWith('/api/health')) {
    return next();
  }
  
  // Exempt internal IPs
  if (req.ip === '127.0.0.1' || req.ip === '::1') {
    return next();
  }
  
  next();
};
```

## Monitoring and Logging

### Log Events
- Rate limit exceeded events are logged with details:
  - IP address
  - Request path
  - User agent
  - Timestamp

### Metrics
- Rate limit usage metrics
- Exceeded request counts
- Store type (memory/Redis)

### Alerting
- Alert on sustained rate limiting
- Monitor for potential DDoS attacks
- Track abnormal usage patterns

## Redis Configuration (Production)

### Setup
```bash
# Install Redis store dependency
npm install rate-limit-redis

# Configure Redis connection
REDIS_URL=redis://username:password@host:port/database
```

### Benefits
- **Distributed**: Works across multiple application instances
- **Persistence**: Survives application restarts
- **Performance**: Efficient memory usage
- **Consistency**: Consistent rate limiting across cluster

### Fallback Strategy
```typescript
const getRateLimitStore = () => {
  if (redisClient && config.nodeEnv === 'production') {
    return new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'ratelimit:',
    });
  }
  
  // Fallback to memory store
  return undefined;
};
```

## Testing

### Test Endpoints
```bash
# Test global rate limiting
curl -X GET http://localhost:3010/api/health

# Test auth rate limiting
curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Check rate limit headers
curl -I http://localhost:3010/api/health
```

### Development Testing
```typescript
// Temporarily increase limits for testing
if (config.nodeEnv === 'test') {
  globalRateLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 1000, // High limit for testing
    // ... other options
  });
}
```

## Best Practices

### Configuration
1. **Start Conservative**: Begin with strict limits and adjust as needed
2. **Monitor Usage**: Regularly review rate limit statistics
3. **User Communication**: Provide clear error messages with retry information
4. **Gradual Escalation**: Increase limits based on actual usage patterns

### Security
1. **IP-Based Limits**: Primary protection against abuse
2. **User-Based Limits**: Additional protection for authenticated users
3. **Endpoint-Specific**: Different limits for different functionality
4. **Brute Force Protection**: Strict limits on authentication endpoints

### Performance
1. **Efficient Storage**: Use appropriate store for deployment scale
2. **Minimal Overhead**: Rate limiting should not significantly impact performance
3. **Caching**: Leverage Redis for efficient distributed rate limiting
4. **Cleanup**: Regularly clean up expired rate limit data

## Troubleshooting

### Common Issues

#### Rate Limits Too Strict
```bash
# Temporary solution: Increase limits
export RATE_LIMIT_MAX=2000
```

#### Redis Connection Issues
```bash
# Check Redis connection
redis-cli ping

# Fallback to memory store
export REDIS_URL=""
```

#### Header Issues
```typescript
// Ensure proper header configuration
standardHeaders: true,
legacyHeaders: false,
```

### Debugging
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Check rate limit store
curl http://localhost:3010/api/health/ratelimit-stats
```

### Monitoring
- Monitor rate limit exceed events
- Track store performance (memory vs Redis)
- Alert on abnormal rate limiting patterns
- Regular review of limit effectiveness

## Integration with Other Systems

### Load Balancers
- Coordinate with upstream rate limiting
- Ensure consistent limits across infrastructure

### CDN Integration
- Edge rate limiting where possible
- Cache rate limit decisions

### Monitoring Systems
- Export rate limit metrics to Prometheus/Grafana
- Integrate with alerting systems

### Analytics
- Track rate limit usage patterns
- Analyze for abuse detection
- Optimize limits based on usage

This rate limiting configuration provides robust protection against abuse while maintaining flexibility for legitimate usage patterns.