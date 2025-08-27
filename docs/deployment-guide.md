# Error Database - Deployment Guide

## Deployment Options

### Option 1: Docker Compose (Recommended for Development)

1. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: errdb
         POSTGRES_USER: user
         POSTGRES_PASSWORD: password
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
     
     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
       volumes:
         - redis_data:/data
     
     backend:
       build: ./backend
       ports:
         - "3001:3001"
       environment:
         - DATABASE_URL=postgresql://user:password@postgres:5432/errdb
         - REDIS_URL=redis://redis:6379
         - JWT_SECRET=your-secret-key
       depends_on:
         - postgres
         - redis
     
     frontend:
       build: ./frontend
       ports:
         - "3000:3000"
       environment:
         - VITE_API_BASE_URL=http://localhost:3001
       depends_on:
         - backend
   
   volumes:
     postgres_data:
     redis_data:
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

### Option 2: Railway Deployment

1. **Backend deployment**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway link
   railway add postgresql
   railway add redis
   railway deploy
   ```

2. **Frontend deployment**
   ```bash
   # Deploy to Vercel
   npm install -g vercel
   vercel --prod
   ```

### Option 3: Traditional Server (Ubuntu)

1. **Server setup**
   ```bash
   # Install dependencies
   sudo apt update
   sudo apt install nodejs npm postgresql redis nginx
   
   # Setup PostgreSQL
   sudo -u postgres createdb errdb
   sudo -u postgres createuser errdb_user
   
   # Setup Redis
   sudo systemctl enable redis-server
   sudo systemctl start redis-server
   ```

2. **Deploy application**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/error-database.git
   cd error-database
   
   # Backend setup
   cd backend
   npm install
   npm run build
   
   # Frontend setup
   cd ../frontend
   npm install
   npm run build
   ```

3. **PM2 configuration**
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start backend
   cd backend
   pm2 start dist/server.js --name errdb-backend
   
   # Save PM2 config
   pm2 save
   pm2 startup
   ```

4. **Nginx configuration**
   ```nginx
   # /etc/nginx/sites-available/errdb
   server {
       listen 80;
       server_name your-domain.com;
       
       # Frontend
       location / {
           root /path/to/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # API proxy
       location /api {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Environment Variables

### Production Backend (.env)
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/errdb"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-very-secure-jwt-secret-key"
JWT_REFRESH_SECRET="your-very-secure-refresh-secret-key"
PORT=3001
FRONTEND_URL="https://your-domain.com"
```

### Production Frontend (.env.production)
```env
VITE_API_BASE_URL="https://api.your-domain.com"
VITE_APP_NAME="Error Database"
```

## SSL Certificate (Let's Encrypt)

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Get certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Database Backups

1. **Automated backups**
   ```bash
   # Backup script
   #!/bin/bash
   pg_dump -U user errdb > backup-$(date +%Y%m%d).sql
   
   # Schedule with cron
   0 2 * * * /path/to/backup-script.sh
   ```

2. **Restore backup**
   ```bash
   psql -U user errdb < backup-file.sql
   ```

## Monitoring & Logging

### PM2 Monitoring
```bash
# Monitor application
pm2 monit

# View logs
pm2 logs errdb-backend

# Application info
pm2 show errdb-backend
```

### Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for frequent queries
CREATE INDEX idx_error_codes_search ON error_codes USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_solutions_score ON solutions(score DESC);
```

### Nginx Optimization
```nginx
# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Node.js Optimization
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096"

# Cluster mode (for multi-core CPUs)
pm2 start dist/server.js -i max --name errdb-backend
```

## Health Checks

### API Health Endpoint
```javascript
// routes/health.routes.ts
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus, // Check database connection
    redis: redisStatus   // Check Redis connection
  });
});
```

### Monitoring with Uptime Robot
- Set up monitoring at https://uptimerobot.com/
- Monitor health endpoint every 5 minutes
- Receive alerts for downtime

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx or cloud load balancer)
- Multiple backend instances
- Database connection pooling
- Redis for session storage

### Database Scaling
- Read replicas for read-heavy operations
- Connection pooling with PgBouncer
- Database partitioning for large datasets

### CDN Setup
- Use Cloudflare or similar CDN
- Cache static assets globally
- DDoS protection

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check DATABASE_URL environment variable
   - Verify PostgreSQL is running
   - Check firewall settings

2. **Redis connection errors**
   - Check REDIS_URL environment variable
   - Verify Redis is running

3. **Build errors**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **Permission errors**
   - Check file permissions
   - Verify user has appropriate access

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start

# Or specific debug namespaces
DEBUG=express:* npm start
```

This deployment guide covers various deployment options from development to production, ensuring a smooth deployment process for the error database application.