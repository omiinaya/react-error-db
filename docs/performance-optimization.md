# Performance Optimization Guide

## Overview
This document provides comprehensive performance optimization strategies for the Error Database application, covering database optimization, application performance, caching strategies, and monitoring best practices.

## Performance Metrics

### Key Performance Indicators (KPIs)
- **Response Time**: <200ms for API endpoints
- **Throughput**: >100 requests/second
- **Error Rate**: <1% of total requests
- **Database Query Time**: <50ms average
- **Cache Hit Ratio**: >90%
- **CPU Usage**: <70% under load
- **Memory Usage**: <80% of available

### Monitoring Tools
- **Prometheus**: Metrics collection
- **Grafana**: Dashboard visualization
- **PM2**: Process monitoring
- **pg_stat_statements**: Database query monitoring
- **Redis CLI**: Cache performance monitoring

## Database Optimization

### Indexing Strategies

#### Essential Indexes
```sql
-- Core application indexes
CREATE INDEX idx_errors_application_id ON error_codes(application_id);
CREATE INDEX idx_errors_code ON error_codes(code);
CREATE INDEX idx_errors_created_at ON error_codes(created_at);

-- Solutions indexes
CREATE INDEX idx_solutions_error_id ON solutions(error_id);
CREATE INDEX idx_solutions_user_id ON solutions(user_id);
CREATE INDEX idx_solutions_created_at ON solutions(created_at);

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Vote indexes
CREATE INDEX idx_votes_solution_id ON votes(solution_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_created_at ON votes(created_at);
```

#### Composite Indexes
```sql
-- For common query patterns
CREATE INDEX idx_errors_app_code ON error_codes(application_id, code);
CREATE INDEX idx_solutions_error_votes ON solutions(error_id, vote_count DESC);
CREATE INDEX idx_search_errors ON error_codes USING gin(to_tsvector('english', message));
```

### Query Optimization

#### Slow Query Identification
```sql
-- Enable query monitoring
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Top slow queries
SELECT 
  query, 
  calls,
  total_time,
  mean_time,
  rows,
  shared_blks_hit,
  shared_blks_read
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Query Optimization Techniques
```sql
-- Use EXPLAIN ANALYZE
EXPLAIN ANALYZE SELECT * FROM error_codes WHERE application_id = 1;

-- Avoid SELECT *
SELECT id, code, message FROM error_codes WHERE application_id = 1;

-- Use LIMIT for large results
SELECT * FROM error_codes ORDER BY created_at DESC LIMIT 50;

-- Batch operations
INSERT INTO solutions (error_id, content, user_id) VALUES 
  (1, 'Solution 1', 1),
  (2, 'Solution 2', 1),
  (3, 'Solution 3', 1);
```

### Database Configuration

#### PostgreSQL Tuning
```ini
# postgresql.conf optimizations
max_connections = 200
shared_buffers = 25% of total RAM
effective_cache_size = 50% of total RAM
work_mem = 16MB
maintenance_work_mem = 64MB

# Write optimization
wal_buffers = 16MB
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9

# Query optimization
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### Connection Pooling
```bash
# Install and configure PgBouncer
sudo apt-get install pgbouncer

# pgbouncer.ini configuration
[databases]
errdb_prod = host=localhost port=5432 dbname=errdb_prod

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

## Application Optimization

### Code Optimization

#### Efficient Data Handling
```typescript
// Use pagination for large datasets
async function getErrors(page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit;
  return prisma.errorCode.findMany({
    skip,
    take: limit,
    include: { application: true },
    orderBy: { createdAt: 'desc' }
  });
}

// Batch database operations
async function updateMultipleSolutions(solutions: SolutionUpdate[]) {
  return prisma.$transaction(
    solutions.map(solution => 
      prisma.solution.update({
        where: { id: solution.id },
        data: { content: solution.content }
      })
    )
  );
}
```

#### Memory Management
```typescript
// Stream large responses
app.get('/api/errors/export', async (req, res) => {
  const stream = prisma.errorCode.findManyStream({
    include: { solutions: true }
  });
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=errors.json');
  
  stream.pipe(JSONStream.stringify()).pipe(res);
});

// Use weak references for caching
const cache = new WeakMap();
function getCachedData(key: object) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = computeExpensiveData(key);
  cache.set(key, data);
  return data;
}
```

### API Optimization

#### Response Compression
```typescript
// Enable compression middleware
import compression from 'compression';
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

#### Response Caching
```typescript
// API endpoint caching
app.get('/api/errors', cacheMiddleware(300), async (req, res) => {
  // Cache for 5 minutes
  const errors = await getErrors();
  res.json(errors);
});

// ETag support
app.get('/api/errors/:id', async (req, res) => {
  const error = await getError(req.params.id);
  const etag = generateETag(error);
  
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }
  
  res.set('ETag', etag);
  res.json(error);
});
```

## Caching Strategies

### Redis Configuration

#### Optimal Redis Setup
```bash
# redis.conf optimizations
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Connection pooling
maxclients 10000
timeout 300
tcp-keepalive 60
```

#### Cache Implementation
```typescript
// Redis cache service
class CacheService {
  private client: Redis;
  private defaultTTL = 3600; // 1 hour

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.client.setex(key, ttl || this.defaultTTL, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clearPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}
```

### Cache Patterns

#### Read-Through Cache
```typescript
async function getErrorWithCache(errorId: number): Promise<ErrorCode> {
  const cacheKey = `error:${errorId}`;
  const cached = await cache.get<ErrorCode>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const error = await prisma.errorCode.findUnique({
    where: { id: errorId },
    include: { solutions: true }
  });

  if (error) {
    await cache.set(cacheKey, error, 300); // 5 minutes
  }

  return error;
}
```

#### Write-Through Cache
```typescript
async function updateErrorWithCache(errorId: number, data: Partial<ErrorCode>) {
  const error = await prisma.errorCode.update({
    where: { id: errorId },
    data
  });

  // Update cache
  const cacheKey = `error:${errorId}`;
  await cache.set(cacheKey, error, 300);

  // Invalidate related caches
  await cache.del('errors:list');
  await cache.del('errors:stats');

  return error;
}
```

## Frontend Optimization

### Bundle Optimization

#### Vite Configuration
```typescript
// vite.config.ts optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'axios', 'date-fns'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },
  plugins: [
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    })
  ]
});
```

#### Code Splitting
```typescript
// Lazy load components
const ErrorDetail = lazy(() => import('./pages/ErrorDetail'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));

// Route-based splitting
const router = createBrowserRouter([
  {
    path: '/errors/:id',
    element: <Suspense fallback={<LoadingSpinner />}><ErrorDetail /></Suspense>
  }
]);
```

### Asset Optimization

#### Image Optimization
```bash
# Convert images to WebP
convert input.jpg -quality 80 output.webp

# Optimize SVGs
svgo input.svg output.svg

# Generate responsive images
sharp('input.jpg')
  .resize(800, 600)
  .webp({ quality: 80 })
  .toFile('output.webp');
```

#### Font Optimization
```css
/* Preload critical fonts */
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

/* Font display strategy */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap;
}
```

## Infrastructure Optimization

### Load Balancing

#### Nginx Configuration
```nginx
# Load balancing configuration
upstream backend {
  least_conn;
  server backend1:3010 weight=10;
  server backend2:3010 weight=10;
  server backend3:3010 weight=10;
  keepalive 32;
}

server {
  location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

#### Health Checks
```nginx
# Health check endpoint
location /health {
  access_log off;
  proxy_pass http://backend;
  proxy_connect_timeout 2s;
  proxy_read_timeout 2s;
}
```

### CDN Configuration

#### Cloudflare Optimization
```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
  add_header X-Cache-Status $upstream_cache_status;
}

# API caching
location /api/errors {
  proxy_cache api_cache;
  proxy_cache_valid 200 5m;
  proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
}
```

## Monitoring and Alerting

### Performance Monitoring

#### Prometheus Metrics
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'errdb-backend'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:3010']
    scrape_interval: 15s

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
    scrape_interval: 30s
```

#### Custom Metrics
```typescript
// Custom performance metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Measure request duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    }, duration);
  });
  next();
});
```

### Alerting Rules

#### Critical Alerts
```yaml
# alert.rules.yml
groups:
- name: errdb-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is above 5% for the last 5 minutes"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time above 2 seconds"
```

## Performance Testing

### Load Testing

#### Artillery Configuration
```yaml
# load-test.yml
config:
  target: "https://api.yourdomain.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
  payload:
    path: "users.csv"
    fields:
      - "username"
      - "password"

scenarios:
  - name: "Browse errors"
    flow:
      - get:
          url: "/api/errors"
      - think: 1
      - get:
          url: "/api/errors/{{ $loop