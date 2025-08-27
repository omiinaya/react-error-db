# Database Deployment Guide

This guide covers the setup, configuration, and maintenance of the PostgreSQL database for the Error Database application.

## Environment Setup

### Development Environment
1. **Local Development**:
   ```bash
   # Start PostgreSQL container
   docker-compose up -d postgres
   
   # Run migrations
   npm run db:migrate
   
   # Seed database
   npm run db:seed
   ```

2. **Test Environment**:
   ```bash
   # Use test environment variables
   cp .env.test .env
   
   # Reset test database
   npm run test:db:setup
   ```

### Production Environment
1. **Environment Variables**:
   - Copy `.env.production` to `.env` on production server
   - Update all values with production credentials
   - Ensure strong JWT secrets (64+ characters)

2. **Database Setup**:
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Optional: Seed with production data
   npm run db:seed
   ```

## Database Configuration

### Connection Pooling
The application uses Prisma's built-in connection pooling with these settings:

- **Development**: 2-10 connections
- **Production**: 5-20 connections
- **Timeout**: 30 seconds
- **Idle Timeout**: 30 seconds

### SSL Configuration
For production, enable SSL in `DATABASE_URL`:
```
postgresql://user:password@host:5432/db?sslmode=require
```

## Backup and Recovery

### Manual Backups
```bash
# Create backup
npm run backup:create

# Restore from backup
npm run backup:restore ./backups/backup-file.sql

# List backups
npm run backup:list

# Cleanup old backups
npm run backup:cleanup
```

### Automated Backups
Set up a cron job for daily backups:
```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/app/backend && npm run backup:scheduled
```

### Backup Retention
- Default: 30 days retention
- Compression: Enabled by default
- Storage: Local backups directory

## Monitoring and Maintenance

### Health Checks
```bash
# Check database health
npm run test:db:check

# Monitor connection pool
# Check logs for database query performance
```

### Performance Tuning
1. **Indexing**: Ensure proper indexes on frequently queried columns
2. **Query Optimization**: Use Prisma's query logging to identify slow queries
3. **Connection Management**: Monitor connection pool usage

## Security Considerations

### Database Security
1. **Network Security**:
   - Use VPN or VPC for database access
   - Restrict database port access
   - Enable SSL encryption

2. **Authentication**:
   - Use strong passwords
   - Rotate credentials regularly
   - Use different users for different environments

3. **Data Protection**:
   - Regular backups
   - Encryption at rest
   - Access controls

### Environment Security
1. **Secrets Management**:
   - Never commit secrets to version control
   - Use environment variables or secret management services
   - Rotate JWT secrets regularly

## Troubleshooting

### Common Issues
1. **Connection Issues**:
   - Check database URL format
   - Verify network connectivity
   - Check firewall settings

2. **Migration Issues**:
   - Ensure Prisma schema is up to date
   - Check for conflicting migrations

3. **Performance Issues**:
   - Monitor connection pool usage
   - Check database indexes
   - Review query performance

### Recovery Procedures
1. **Database Corruption**:
   - Restore from latest backup
   - Run database integrity checks

2. **Data Loss**:
   - Restore from backup
   - Investigate root cause

3. **Security Breach**:
   - Rotate all credentials
   - Audit database access logs
   - Restore from clean backup if compromised

## Best Practices

### Development
1. **Migrations**:
   - Always create migrations for schema changes
   - Test migrations in development first
   - Backup before running production migrations

2. **Testing**:
   - Use separate test database
   - Reset database before test runs
   - Use realistic test data

### Production
1. **Monitoring**:
   - Set up database monitoring
   - Alert on slow queries
   - Monitor connection pool health

2. **Maintenance**:
   - Regular backups
   - Database vacuuming
   - Index maintenance

3. **Scaling**:
   - Monitor database load
   - Consider read replicas for heavy read workloads
   - Plan for database partitioning if needed

## Support

For database-related issues:
1. Check application logs
2. Review Prisma documentation
3. Consult PostgreSQL documentation
4. Contact DevOps team for infrastructure issues