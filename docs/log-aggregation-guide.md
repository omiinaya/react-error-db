# Log Aggregation Setup Guide

## Overview
The Error Database application includes comprehensive log aggregation capabilities for centralized logging, monitoring, and analysis.

## Supported Log Aggregation Systems

### Built-in Support
- **Local File Logging**: Daily rotated logs in JSON format
- **Elasticsearch**: Structured log ingestion and search
- **Loki**: Log aggregation from Grafana Labs
- **Custom Transports**: Extensible architecture for additional systems

## Configuration

### Environment Variables
Add the following environment variables to enable log aggregation:

```bash
# Elasticsearch (optional)
ELASTICSEARCH_URL=http://localhost:9200

# Loki (optional)
LOKI_URL=http://localhost:3100

# Log level (error, warn, info, debug)
LOG_LEVEL=info
```

### File Logging
By default, logs are stored in the `logs/` directory with daily rotation:
- `application-*.log` - All application logs
- `error-*.log` - Error logs only
- `exceptions-*.log` - Uncaught exceptions
- `rejections-*.log` - Promise rejections

## Log Structure

### JSON Format
All logs are structured JSON objects with the following fields:
```json
{
  "timestamp": "2024-01-15 10:30:45.123",
  "level": "info",
  "message": "User registered successfully",
  "environment": "production",
  "service": "error-database-backend",
  "requestId": "abc123",
  "method": "POST",
  "path": "/api/auth/register",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "userId": 123,
  "duration": 150
}
```

### Contextual Logging
The system automatically adds request context to all logs:
- Request ID (from `x-request-id` header or generated)
- HTTP method and path
- Client IP address
- User agent
- User ID (when authenticated)

## Integration Points

### Express Middleware
The `addRequestContext` middleware automatically enriches logs with request information:
```typescript
app.use(addRequestContext);
```

### Custom Logging
Use the aggregated logger for custom log messages:
```typescript
import { aggregatedLogger } from '../utils/log-aggregation';

// Basic logging
aggregatedLogger.info('User registered', { userId: 123, email: 'user@example.com' });

// Error logging with context
aggregatedLogger.error('Database connection failed', { 
  error: error.message,
  query: 'SELECT * FROM users',
  duration: 500 
});
```

## Performance Considerations

### Batching
Log aggregation transports use batching to improve performance:
- Elasticsearch: Batches 100 logs or every 5 seconds
- Buffer management to prevent memory leaks
- Automatic retry on failure

### Resource Usage
- File logging: Minimal overhead, uses Winston's efficient rotation
- Network transports: Async operations to avoid blocking
- Memory: Configurable buffer sizes prevent excessive memory usage

## Monitoring and Alerting

### Key Log Patterns to Monitor
1. **Error Rates**: Track error log frequency
2. **Performance**: Log duration fields for performance analysis
3. **Security**: Monitor authentication and authorization logs
4. **Business Metrics**: User registrations, error submissions, etc.

### Alert Configuration
Set up alerts for:
- Error rate spikes (> 10 errors per minute)
- High latency operations (> 2 seconds)
- Authentication failures
- Database connection errors

## Troubleshooting

### Common Issues
1. **Missing Logs**: Check `LOG_LEVEL` configuration
2. **Permission Issues**: Ensure write access to `logs/` directory
3. **Network Issues**: Verify aggregation service connectivity
4. **Memory Usage**: Monitor buffer sizes for network transports

### Debug Mode
Enable debug logging for troubleshooting:
```bash
LOG_LEVEL=debug npm run dev
```

## Best Practices

### Log Content
1. **Structured Data**: Always use JSON structure with meaningful fields
2. **Context**: Include relevant context (userId, requestId, etc.)
3. **Sensitive Data**: Never log passwords, tokens, or PII
4. **Consistency**: Use consistent field names across logs

### Performance
1. **Async Logging**: Use async transports for production
2. **Batching**: Enable batching for network transports
3. **Rotation**: Use log rotation to manage disk space
4. **Monitoring**: Monitor log aggregation system health

### Security
1. **Access Control**: Secure log aggregation endpoints
2. **Encryption**: Use HTTPS for network transports
3. **Retention**: Implement appropriate log retention policies
4. **Auditing**: Regular audit of log access and content

## Extending Log Aggregation

### Adding New Transports
Implement the `LogAggregationTransport` interface:
```typescript
interface LogAggregationTransport {
  sendLog: (log: any) => Promise<void>;
  flush: () => Promise<void>;
}
```

### Example: Datadog Transport
```typescript
class DatadogTransport implements LogAggregationTransport {
  async sendLog(log: any): Promise<void> {
    // Send to Datadog API
  }
  
  async flush(): Promise<void> {
    // Flush any buffered logs
  }
}

// Register the transport
logAggregation.addTransport(new DatadogTransport());
```

## Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Elasticsearch](https://www.elastic.co/guide/index.html)
- [Loki](https://grafana.com/docs/loki/latest/)
- [Structured Logging Best Practices](https://www.honeycomb.io/blog/structured-logging/)