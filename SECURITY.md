# Security Policy

## Overview

This document outlines the security measures, best practices, and policies for the Error Database project. We are committed to maintaining a secure application for all users.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do not** create public GitHub issues for security vulnerabilities
2. Send an email to: security@example.com (replace with your security email)
3. Include details about the vulnerability, steps to reproduce, and potential impact
4. Allow us time to investigate and respond before disclosing publicly

We will acknowledge receipt within 48 hours and provide regular updates on our progress.

## Security Features

### Authentication & Authorization

- **JWT (JSON Web Tokens)** for authentication
- Token expiration with refresh token support
- Role-based access control (RBAC) with admin privileges
- Protected routes requiring authentication
- Secure password hashing using bcrypt

### Input Validation

- **Zod schemas** for all API endpoints
- Type-safe input validation and sanitization
- Protection against NoSQL injection via Prisma ORM
- UUID validation for IDs
- String length limits and format validation

### Database Security

- **Prisma ORM** with parameterized queries (prevents SQL/NoSQL injection)
- Environment variable-based connection strings (no hardcoded credentials)
- Database user privileges following least privilege principle
- Regular database backups with validation

### Container Security (Docker)

All main production services are hardened with:

- `read_only: true` - Read-only filesystems prevent unauthorized modifications
- `security_opt: - no-new-privileges:true` - Prevents privilege escalation
- `tmpfs` mounts for temporary directories - Prevents file persistence attacks
- Volume mounted as read-only with `:ro` flag where appropriate

Services intentionally excluded from hardening:

- **Backend (development)**: Needs writable volumes for hot reload and Prisma schema
- **Frontend (development)**: Needs writable volumes for hot reload
- **Backup service**: Requires write access to save database backups
- **pgAdmin**: Optional development tool requiring internal storage
- **Certbot**: Requires write access for Let's Encrypt certificate management

### Secrets Management

All secrets are managed through environment variables:

- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - JWT signing key (minimum 32 characters)
- `JWT_REFRESH_SECRET` - JWT refresh token key (minimum 32 characters)
- `POSTGRES_USER` / `POSTGRES_PASSWORD` - Database credentials
- `REDIS_URL` - Redis connection string

Never commit secrets to source code. Use `.env` files locally and environment variables in production.

### HTTP/HTTPS Security

- **SSL/TLS** required in production
- **HSTS** (HTTP Strict Transport Security) enabled
- **CORS** properly configured
- Secure headers:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (configured per service)

## Security Remediation History

### 2026-02-06: Major Security Hardening

**Total Findings Addressed:** 105 of 111 (95%)

#### Critical Issues Resolved

1. **Hardcoded Secrets (3 findings)**
   - Removed hardcoded JWT and bearer tokens from test files
   - Made secrets configurable via environment variables
   - Added `TEST_JWT_TOKEN` and `TEST_BEARER_TOKEN` to `.env.example`

2. **Child Process Command Injection (1 finding)**
   - Implemented `sanitizePath()` function in `backup.ts`
   - Added `validateConfig()` to validate backup directories
   - Replaced `execSync` with `execFileSync` for safer argument handling
   - PATH traversal protection implemented

3. **Unsafe Format String (2 findings)**
   - Fixed `console.log` usage to prevent format string injection
   - Updated `diagnostic-script.js` and `test/test-admin.js`

4. **MongoDB NoSQL Injection Prevention (64 findings)**
   - Audited all database queries flagged by semgrep
   - Verified all queries use Prisma ORM with parameterized queries
   - Added UUID validation for `solutionIds` array in bulk operations
   - Documented safety with nosemgrep comments where appropriate
   - Input validation via Zod schemas prevents injection attacks

#### Infrastructure Security Improvements

5. **Docker Container Hardening**
   - Main production containers (`postgres`, `redis`, `nginx`, `load-balancer`) hardened:
     - `read_only: true`
     - `security_opt: - no-new-privileges:true`
     - `tmpfs` mounts for `/tmp`, `/var/run`, `/var/cache/nginx`
   - Monitoring stack hardened (`prometheus`, `grafana`)
   - SSL configuration hardened (`nginx-ssl`, `certbot`)

6. **NGINX Configuration (2 findings)**
   - Documented location-specific headers (Cache-Control, CSP)
   - Added nosemgrep comments for intentional variations

7. **HTTP/HTTPS in Tests (6 findings)**
   - Made protocol configurable via `USE_HTTPS` environment variable
   - Test scripts support both http (development) and https (production)

#### Remaining Issues (6 findings)

6 Docker-related findings remain for services that intentionally require writable filesystems:
- `backup` service - Needs write access to save database backups
- `backend` (dev) - Writable volumes for hot reload and Prisma schema
- `pgadmin` (dev) - Internal storage required for pgAdmin functionality

These are intentional design choices documented in-line with comments explaining the need for write access.

## Security Best Practices

### For Developers

1. **Never commit secrets** to the repository
2. **Use .env files** for local configuration (in .gitignore)
3. **Validate all input** using Zod schemas before processing
4. **Use parameterized queries** via Prisma ORM (no raw SQL/NoSQL)
5. **Review database queries** for NoSQL injection risks
6. **Keep dependencies updated** with `npm audit fix`
7. **Test for security vulnerabilities** before deploying

### For Operations

1. **Use SSL/TLS** in all production environments
2. **Rotate secrets** regularly (consider a secrets manager like HashiCorp Vault)
3. **Enable firewalls** and restrict access by IP
4. **Monitor logs** for suspicious activity
5. **Implement rate limiting** to prevent DoS attacks
6. **Regular backups** with secure storage
7. **Keep Docker images updated** to latest secure versions
8. **Scan dependencies** for vulnerabilities (npm audit, Snyk, etc.)

### Code Review Checklist

- [ ] No hardcoded secrets or credentials
- [ ] All user input is validated
- [ ] Database queries use ORM with parameterized queries
- [ ] Proper error handling without exposing sensitive information
- [ ] Authentication and authorization checks present
- [ ] Rate limiting implemented where appropriate
- [ ] Logging sanitized (no sensitive data in logs)
- [ ] CORS properly configured
- [ ] Security headers set

## Dependency Scanning

We regularly scan our dependencies for known vulnerabilities:

- **npm audit** - Built-in npm vulnerability scanner
- **Snyk** - Container and dependency scanning (if implemented)
- **Semgrep** - Static code analysis for security issues

## Security Testing

### Automated Testing

- Unit tests for critical security functions (authentication, validation)
- Integration tests for API security
- Container security scanning in CI/CD pipeline

### Manual Testing

- Penetration testing before major releases
- Threat modeling for new features
- Security code reviews for sensitive endpoints

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NGINX (SSL Termination)                   │
│            - read_only filesystem                              │
│            - Security headers                                  │
│            - Rate limiting                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Node.js)                       │
│            - JWT Authentication                               │
│            - Input Validation (Zod)                           │
│            - Rate Limiting                                    │
│            - RBAC (Role-Based Access Control)                 │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────────┐    ┌─────────────────────┐
│   PostgreSQL        │    │      Redis          │
│   - read_only       │    │   - read_only       │
│   - Encrypted       │    │   - TLS optional    │
│   - Network isolated│    │   - Network isolated│
└─────────────────────┘    └─────────────────────┘
```

## Compliance

This project is designed with security best practices but does not claim compliance with any specific regulatory frameworks (SOC 2, HIPAA, PCI-DSS, etc.). If you need compliance, additional controls and audits will be required.

## Supported Platforms

- **Production**: docker-compose.prod.yml (hardened containers)
- **Development**: docker-compose.yml (hot reload enabled, less hardened)
- **Scaling**: docker-compose.scale.yml (multiple instances, hardened)
- **SSL/TLS**: docker-compose.ssl.yml (Let's Encrypt integration, hardened)

## Version History

- **v2.0** (2026-02-06): Major security hardening, 105 findings resolved
- **v1.0**: Initial release

## Questions?

For security-related questions or concerns, please contact the security team at security@example.com.