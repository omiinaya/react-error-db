# Health Check Endpoints Guide

## Overview
The Error Database application provides comprehensive health check endpoints for monitoring and orchestration. These endpoints are essential for Kubernetes, Docker, and other orchestration systems.

## Available Endpoints

### Basic Health Check
**Endpoint**: `GET /api/health`
- **Purpose**: Basic application status
- **Response**: 200 OK with basic status information
- **Use Case**: Simple health monitoring

### Readiness Probe
**Endpoint**: `GET /api/health/readiness`
- **Purpose**: Check if application is ready to serve traffic
- **Response**: 
  - 200 OK: Application is ready
  - 503 Service Unavailable: Application not ready (database down, etc.)
- **Use Case**: Kubernetes readiness probe, load balancer health checks

### Liveness Probe
**Endpoint**: `GET /api/health/liveness`
- **Purpose**: Check if application is running
- **Response**: 200 OK with process information
- **Use Case**: Kubernetes liveness probe, process monitoring

### Startup Probe
**Endpoint**: `GET /api/health/startup`
- **Purpose**: Check if application started successfully
- **Response**: 
  - 200 OK: Application started successfully
  - 503 Service Unavailable: Startup failed
- **Use Case**: Kubernetes startup probe, initialization monitoring

### Metrics Endpoint
**Endpoint**: `GET /api/health/metrics`
- **Purpose**: Detailed system and process metrics
- **Response**: 200 OK with comprehensive metrics
- **Use Case**: Performance monitoring, resource usage tracking

### Information Endpoint
**Endpoint**: `GET /api/health/info`
- **Purpose**: Application information and metadata
- **Response**: 200 OK with application details
- **Use Case**: Deployment information, version checking

## Kubernetes Configuration

### Recommended Probes
```yaml
# Kubernetes deployment configuration
containers:
- name: error-database-backend
  # Startup probe - wait for application to start
  startupProbe:
    httpGet:
      path: /api/health/startup
      port: 3010
    failureThreshold: 30  # 30 attempts
    periodSeconds: 10     # Check every 10 seconds
  
  # Readiness probe - check if ready to serve traffic
  readinessProbe:
    httpGet:
      path: /api/health/readiness
      port: 3010
    initialDelaySeconds: 5
    periodSeconds: 10
    failureThreshold: 3
  
  # Liveness probe - check if application is running
  livenessProbe:
    httpGet:
      path: /api/health/liveness
      port: 3010
    initialDelaySeconds: 30
    periodSeconds: 10
    failureThreshold: 3
```

### Docker Health Check
```dockerfile
# Docker health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3010/api/health/readiness || exit 1
```

## Response Formats

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "uptime": 1234.56,
    "environment": "production",
    "version": "1.0.0"
  }
}
```

### Error Response (503 Service Unavailable)
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Database connection failed",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "services": {
      "database": false
    }
  }
}
```

## Monitoring and Alerting

### Key Metrics to Monitor
1. **Response Time**: Health check endpoint latency
2. **Success Rate**: Percentage of successful health checks
3. **Uptime**: Application availability
4. **Resource Usage**: Memory and CPU utilization

### Alert Configuration
Set up alerts for:
- Health check failures (> 3 consecutive failures)
- High response latency (> 1 second)
- Resource exhaustion (> 80% memory usage)
- Database connection failures

## Integration with Monitoring Systems

### Prometheus
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'error-database'
    metrics_path: '/api/health/metrics'
    static_configs:
      - targets: ['localhost:3010']
```

### Grafana Dashboard
Create a dashboard with:
- Health check status
- Response times
- Resource usage
- Error rates

### Custom Checks
You can add custom health checks by extending the health router:
```typescript
// Add custom service checks
router.get('/health/custom', async (_req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalApi: await checkExternalApi(),
  };
  
  const allHealthy = Object.values(checks).every(status => status);
  
  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    data: { checks }
  });
});
```

## Security Considerations

### Access Control
- Health endpoints are public by design
- Consider firewall rules for production environments
- Use network policies to restrict access

### Information Disclosure
- Health endpoints expose system information
- Review exposed data for sensitive information
- Consider authentication for detailed metrics

### Rate Limiting
- Health checks should be exempt from rate limiting
- Monitor for health check abuse
- Implement IP-based restrictions if needed

## Troubleshooting

### Common Issues
1. **Database Connection Failures**: Check database URL and credentials
2. **High Latency**: Investigate resource constraints
3. **Intermittent Failures**: Check network connectivity
4. **Startup Timeouts**: Adjust Kubernetes probe thresholds

### Debug Mode
Enable debug logging for health checks:
```bash
LOG_LEVEL=debug npm run dev
```

### Testing Health Checks
```bash
# Test basic health
curl http://localhost:3010/api/health

# Test readiness
curl http://localhost:3010/api/health/readiness

# Test with verbose output
curl -v http://localhost:3010/api/health/liveness
```

## Best Practices

### Probe Configuration
1. **Startup Probe**: Use longer timeouts for initial startup
2. **Readiness Probe**: Check all dependent services
3. **Liveness Probe**: Keep simple and fast
4. **Periodicity**: Balance between responsiveness and load

### Monitoring
1. **Alerting**: Set up proactive alerts for health check failures
2. **Dashboards**: Visualize health status and trends
3. **Logging**: Log health check failures for debugging
4. **Metrics**: Track health check performance over time

### Performance
1. **Caching**: Consider caching health check results (with short TTL)
2. **Async Checks**: Perform expensive checks asynchronously
3. **Timeout Handling**: Implement proper timeouts for external checks
4. **Circuit Breakers**: Use circuit breakers for external dependencies

## Resources

- [Kubernetes Probes Documentation](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Docker Healthcheck](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Prometheus Monitoring](https://prometheus.io/docs/introduction/overview/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)