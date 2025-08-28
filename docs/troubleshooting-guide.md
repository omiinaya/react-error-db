# Troubleshooting Guide

## Overview
This guide provides comprehensive troubleshooting procedures for the Error Database application, covering common issues, error messages, and step-by-step resolution procedures.

## Quick Reference

### Common Issues
1. **Database Connection Issues**
2. **Authentication Problems** 
3. **Performance Degradation**
4. **Deployment Failures**
5. **SSL/TLS Configuration**
6. **Logging and Monitoring**
7. **Security Incidents**

### Emergency Contacts
- **Primary Admin**: admin@errdb.com
- **Secondary Admin**: backup-admin@errdb.com
- **Emergency Pager**: +1-555-EMERGENCY

## Database Issues

### Connection Problems

#### Symptoms
- "Connection refused" errors
- "Connection timeout" messages
- High latency in database operations

#### Diagnosis
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U errdb_user -d errdb_prod -c "SELECT 1;"

# Check connection limits
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Verify network connectivity
telnet localhost 5432
```

#### Resolution
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Increase connection limits
echo "max_connections = 200" >> /etc/postgresql/15/main/postgresql.conf

# Clear connection pool
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"
```

### Performance Issues

#### Symptoms
- Slow query response times
- High CPU usage on database server
- Timeout errors

#### Diagnosis
```bash
# Check active queries
psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Identify slow queries
psql -c "SELECT query, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check database size
psql -c "SELECT pg_size_pretty(pg_database_size('errdb_prod'));"

# Monitor locks
psql -c "SELECT * FROM pg_locks WHERE granted = false;"
```

#### Resolution
```sql
-- Create indexes on frequently queried columns
CREATE INDEX idx_errors_application_id ON error_codes(application_id);
CREATE INDEX idx_solutions_error_id ON solutions(error_id);

-- Vacuum and analyze
VACUUM ANALYZE;

-- Optimize queries
EXPLAIN ANALYZE SELECT * FROM error_codes WHERE application_id = 1;
```

## Application Issues

### Startup Failures

#### Symptoms
- Application fails to start
- Port already in use errors
- Environment variable issues

#### Diagnosis
```bash
# Check running processes
ps aux | grep node

# Check port usage
sudo lsof -i :3001
sudo lsof -i :3000

# Verify environment variables
printenv | grep NODE_ENV
printenv | grep DATABASE_URL

# Check application logs
tail -f /var/log/errdb/application.log
```

#### Resolution
```bash
# Kill processes using ports
sudo kill -9 $(lsof -t -i:3001)
sudo kill -9 $(lsof -t -i:3000)

# Set environment variables
export NODE_ENV=production
export DATABASE_URL=postgresql://user:pass@localhost:5432/errdb_prod

# Restart application
pm2 restart errdb-backend
```

### Authentication Issues

#### Symptoms
- "Invalid token" errors
- "Access denied" messages
- Session expiration problems

#### Diagnosis
```bash
# Check JWT configuration
echo $JWT_SECRET | wc -c
echo $JWT_REFRESH_SECRET | wc -c

# Verify token expiration
curl -H "Authorization: Bearer <token>" http://localhost:3010/api/auth/verify

# Check Redis connection
redis-cli -h localhost -p 6379 ping
```

#### Resolution
```bash
# Rotate JWT secrets
curl -X POST -H "Authorization: Bearer <admin-token>" \
  http://localhost:3010/api/secrets/JWT_SECRET/rotate

# Clear Redis sessions
redis-cli -h localhost -p 6379 FLUSHALL

# Verify environment variables
export JWT_SECRET=$(openssl rand -base64 64)
export JWT_REFRESH_SECRET=$(openssl rand -base64 64)
```

## Network Issues

### SSL/TLS Problems

#### Symptoms
- "Certificate invalid" errors
- "SSL handshake failed" messages
- Mixed content warnings

#### Diagnosis
```bash
# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate expiration
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Verify certificate chain
sslscan yourdomain.com
```

#### Resolution
```bash
# Renew Let's Encrypt certificate
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx

# Check certificate configuration
sudo nginx -t
```

### Firewall Issues

#### Symptoms
- Connection timeouts
- "Connection refused" errors
- Intermittent connectivity

#### Diagnosis
```bash
# Check firewall status
sudo ufw status

# Test port accessibility
telnet yourdomain.com 443
telnet yourdomain.com 80

# Check routing
traceroute yourdomain.com
```

#### Resolution
```bash
# Open necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check rules
sudo ufw status verbose
```

## Performance Issues

### High CPU Usage

#### Symptoms
- Slow response times
- System becoming unresponsive
- High load average

#### Diagnosis
```bash
# Check CPU usage
top -c
htop

# Identify problematic processes
ps aux --sort=-%cpu | head -10

# Monitor Node.js processes
pm2 monit

# Check for memory leaks
node --inspect-brk server.js
```

#### Resolution
```bash
# Scale application
pm2 scale errdb-backend +2

# Optimize database queries
EXPLAIN ANALYZE SELECT * FROM large_table;

# Add caching
redis-cli SET cache_key "value" EX 3600
```

### Memory Issues

#### Symptoms
- "Out of memory" errors
- High memory usage
- Application crashes

#### Diagnosis
```bash
# Check memory usage
free -h

# Monitor memory trends
vmstat 1

# Check Node.js memory
pm2 show errdb-backend

# Generate heap dump
kill -USR2 <pid>
```

#### Resolution
```bash
# Increase memory limits
pm2 restart errdb-backend --max-memory-restart 1G

# Optimize memory usage
node --max-old-space-size=4096 server.js

# Clear cache
redis-cli FLUSHALL
```

## Deployment Issues

### Build Failures

#### Symptoms
- npm install failures
- TypeScript compilation errors
- Docker build failures

#### Diagnosis
```bash
# Check npm logs
npm install --verbose

# Verify Node.js version
node --version
npm --version

# Check Docker build
docker build . --no-cache

# Review TypeScript errors
npx tsc --noEmit
```

#### Resolution
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Update Node.js
nvm install 18
nvm use 18
```

### Container Issues

#### Symptoms
- Docker container crashes
- Image pull failures
- Volume mount problems

#### Diagnosis
```bash
# Check container status
docker ps -a
docker logs <container_id>

# Inspect container
docker inspect <container_id>

# Check Docker daemon
sudo systemctl status docker

# Verify image integrity
docker images --digests
```

#### Resolution
```bash
# Restart Docker
sudo systemctl restart docker

# Rebuild images
docker-compose build --no-cache

# Clean up resources
docker system prune -a
```

## Security Incidents

### Suspicious Activity

#### Symptoms
- Unusual login attempts
- Unexpected database modifications
- Security alert notifications

#### Diagnosis
```bash
# Check audit logs
psql -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;"

# Review access logs
tail -f /var/log/nginx/access.log | grep -E "(404|500|POST)"

# Check failed logins
grep "Failed password" /var/log/auth.log

# Monitor network traffic
sudo tcpdump -i eth0 -n port 80 or port 443
```

#### Resolution
```bash
# Block suspicious IPs
sudo fail2ban-client set nginx-ban banip 192.168.1.100

# Rotate all secrets
curl -X POST -H "Authorization: Bearer <admin-token>" \
  http://localhost:3010/api/secrets/rotate-all

# Review security policies
npm audit
npx snyk test
```

### Data Breach Response

#### Emergency Procedures
1. **Isolate** affected systems
2. **Preserve** evidence for forensic analysis
3. **Notify** appropriate stakeholders
4. **Rotate** all credentials and secrets
5. **Audit** access logs and database changes

#### Recovery Steps
```bash
# Take system offline
sudo systemctl stop nginx
sudo systemctl stop errdb-backend

# Restore from backup
pg_restore -d errdb_prod /backups/errdb-clean-backup.dump

# Security audit
npm audit fix --force
npx snyk monitor
```

## Monitoring and Logging

### Log Analysis

#### Common Log Patterns
```bash
# Error patterns
grep -E "(ERROR|error|Exception)" /var/log/errdb/application.log

# Performance issues
grep "slow" /var/log/errdb/application.log

# Security events
grep -E "(failed|invalid|unauthorized)" /var/log/errdb/application.log
```

#### Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/errdb

# Manual log rotation
logrotate -f /etc/logrotate.d/errdb

# Check log files
ls -la /var/log/errdb/
```

### Monitoring Alerts

#### Critical Alerts
- Database connection failures
- High error rate (>5%)
- CPU usage >90% for 5 minutes
- Memory usage >90%
- SSL certificate expiration <7 days

#### Alert Response
```bash
# Check system status
uptime
free -h
df -h

# Review recent changes
git log --oneline -10

# Verify backups
ls -la /backups/
```

## Database Maintenance

### Routine Maintenance

#### Daily Tasks
```bash
# Check database health
psql -c "SELECT now(), version();"

# Monitor replication lag
psql -c "SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;"

# Check table bloat
psql -c "SELECT schemaname, tablename, n_dead_tup FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;"
```

#### Weekly Tasks
```bash
# Vacuum database
psql -c "VACUUM ANALYZE;"

# Check index usage
psql -c "SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan;"

# Backup verification
pg_restore --list /backups/errdb-latest.dump | head -10
```

### Emergency Recovery

#### Database Corruption
```bash
# Check database integrity
psql -c "CHECKPOINT;"
psql -c "SELECT pg_check