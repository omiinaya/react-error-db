# Uptime Monitoring Guide

## Overview
The Error Database application includes comprehensive uptime monitoring with real-time metrics, alerting, and performance tracking. This system helps ensure high availability and quick detection of performance issues.

## Features

### Real-time Monitoring
- **Request Tracking**: Monitor all HTTP requests and response times
- **Error Rate Calculation**: Track error rates and identify trends
- **Memory Usage**: Monitor heap memory usage with alert thresholds
- **Performance Metrics**: Track average response times and system load

### Alerting System
- **Memory Alerts**: Warn when memory usage exceeds 80% (critical at 90%)
- **Error Rate Alerts**: Alert when error rate exceeds 10% (critical at 20%)
- **Restart Alerts**: Detect frequent application restarts (>3 per hour)
- **Real-time Notifications**: Integrated with Sentry for immediate alerts

### Health Status
- **Healthy**: All systems normal
- **Degraded**: Performance issues detected
- **Unhealthy**: Critical issues requiring immediate attention

## Configuration

### Environment Variables
```bash
# Memory usage threshold (default: 0.8 = 80%)
MEMORY_THRESHOLD=0.8

# Error rate threshold (default: 0.1 = 10%)
ERROR_RATE_THRESHOLD=0.1

# Restart threshold (default: 3 restarts per hour)
RESTART_THRESHOLD=3
```

### Monitoring Intervals
- **Memory Check**: Every 30 seconds
- **Error Rate Check**: Every 60 seconds  
- **Restart Check**: Every 60 minutes
- **Request Tracking**: Real-time for each HTTP request

## API Endpoints

### Uptime Metrics
**Endpoint**: `GET /api/health/uptime`
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "message": "System is healthy",
    "metrics": {
      "startTime": "2024-01-15T10:30:45.123Z",
      "totalUptime": 1234.56,
      "lastRestart": "2024-01-15T10:30:45.123Z",
      "restarts": 0,
      "requestCount": 150,
      "errorCount": 5,
      "averageResponseTime": 45.2,
      "memoryUsage": {
        "rss": 123456789,
        "heapTotal": 98765432,
        "heapUsed": 76543210,
        "external": 1234567,
        "arrayBuffers": 12345
      }
    },
    "recentAlerts": [],
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}
```

### Health Information (Enhanced)
The `/api/health/info` endpoint now includes uptime metrics:
```json
{
  "uptime": 1234.56,
  "totalUptime": 1234.56,
  "startTime": "2024-01-15T10:30:45.123Z"
}
```

## Integration

### Middleware Integration
The uptime monitoring middleware is automatically integrated into the Express app:
```typescript
// Records request timing and errors
app.use(uptimeMiddleware);
```

### Sentry Integration
Alerts are automatically sent to Sentry:
- Memory alerts → Sentry error/warning messages
- Error rate alerts → Sentry error/warning messages  
- Restart alerts → Sentry error messages

### Health Check Integration
Uptime status is available through health endpoints for orchestration systems.

## Alert Types

### Memory Alerts
- **Warning**: Memory usage > 80%
- **Critical**: Memory usage > 90%
- **Data**: Current memory usage, heap statistics

### Error Rate Alerts  
- **Warning**: Error rate > 10%
- **Critical**: Error rate > 20%
- **Data**: Request count, error count, calculated rate

### Restart Alerts
- **Critical**: > 3 restarts per hour
- **Data**: Restart count, threshold

## Monitoring Dashboard

### Key Metrics to Display
1. **Uptime Percentage**: Total system availability
2. **Response Times**: P50, P90, P95 response times
3. **Error Rates**: 4xx and 5xx error percentages
4. **Memory Usage**: Heap usage trends
5. **Alert History**: Recent alerts and resolutions

### Grafana Dashboard
Create a dashboard with:
- Uptime status panel
- Memory usage graph
- Error rate graph
- Response time histogram
- Alert history table

## Configuration Options

### Threshold Customization
```typescript
// Custom thresholds
const monitor = new UptimeMonitor();
monitor.memoryThreshold = 0.75; // 75%
monitor.errorRateThreshold = 0.05; // 5%
monitor.restartThreshold = 2; // 2 restarts/hour
```

### Alert Customization
```typescript
// Custom alert handling
uptimeMonitor.addAlert = function(alert) {
  // Custom alert logic
  sendSlackNotification(alert);
  this.alerts.push(alert);
};
```

## Usage Examples

### Manual Monitoring
```typescript
import { uptimeMonitor } from '../utils/uptime-monitor';

// Get current status
const status = uptimeMonitor.getStatus();
console.log(`System status: ${status.status}`);

// Get detailed metrics
const metrics = uptimeMonitor.getMetrics();
console.log(`Memory usage: ${metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal * 100}%`);

// Get recent alerts
const alerts = uptimeMonitor.getAlerts(5);
alerts.forEach(alert => console.log(alert.message));
```

### Custom Health Checks
```typescript
// Add custom health checks
router.get('/health/custom', (_req, res) => {
  const status = uptimeMonitor.getStatus();
  const metrics = uptimeMonitor.getMetrics();
  
  res.json({
    status: status.status,
    metrics,
    customCheck: await checkCustomService(),
  });
});
```

## Performance Considerations

### Minimal Overhead
- Request tracking adds ~0.1ms overhead per request
- Memory monitoring uses setInterval with 30s intervals
- Alert calculations are optimized and batched

### Memory Management
- Response times are limited to last 1000 requests
- Alerts are limited to last 100 entries
- No persistent storage (reset on restart)

### Scaling
- Designed for high-throughput applications
- Memory usage scales with request volume
- Alert system handles high alert rates

## Troubleshooting

### Common Issues
1. **High Memory Usage**: Check for memory leaks, optimize code
2. **High Error Rates**: Investigate application errors, dependencies
3. **Frequent Restarts**: Check stability issues, resource constraints
4. **Missing Alerts**: Verify Sentry configuration

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Test endpoints
curl http://localhost:3010/api/health/uptime
curl http://localhost:3010/api/health/metrics
```

### Reset Monitoring
```typescript
// Reset metrics (for testing)
uptimeMonitor.reset();
```

## Best Practices

### Alert Configuration
1. **Thresholds**: Set appropriate thresholds for your environment
2. **Notification**: Integrate with multiple alert channels
3. **Escalation**: Define alert escalation procedures
4. **Documentation**: Document alert response procedures

### Monitoring Strategy
1. **Baseline**: Establish performance baselines
2. **Trends**: Monitor trends rather than single data points
3. **Correlation**: Correlate alerts with other system metrics
4. **Review**: Regular review of alert effectiveness

### Performance Optimization
1. **Sampling**: Consider request sampling for very high traffic
2. **Aggregation**: Aggregate metrics for longer time periods
3. **Storage**: Consider persistent storage for historical data
4. **Archiving**: Archive old alerts and metrics

## Resources

- [Node.js Process Metrics](https://nodejs.org/api/process.html#processmemoryusage)
- [Performance Monitoring Best Practices](https://github.com/goldbergyoni/nodebestpractices#-6-performance-practices)
- [Alerting Strategies](https://sre.google/sre-book/alerting-on-slos/)
- [Monitoring Distributed Systems](https://landing.google.com/sre/sre-book/chapters/monitoring-distributed-systems/)