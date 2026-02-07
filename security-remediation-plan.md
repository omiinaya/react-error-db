# Security Remediation Plan
**Based on Semgrep Analysis Report - 2026-02-06**
**Total Findings:** 111

---

## Phase 1: Critical Security Issues (Week 1)
**Goal:** Eliminate immediate vulnerabilities that could lead to credential theft or system compromise

### Task 1.1: Remove Hardcoded Secrets (3 findings)

#### 1.1.1: Hardcoded JWT Token
- File: `backend/test-auth-fix.js:11`
- Action: Remove hardcoded JWT token
- Implementation:
  - Create environment variable `TEST_JWT_TOKEN`
  - Update code to read from `process.env.TEST_JWT_TOKEN`
  - Add to `.env.example` for documentation
  - Update README with usage instructions

#### 1.1.2 & 1.1.3: Hardcoded Bearer Tokens
- File: `backend/test-auth-fix.js:18`
- Action: Remove hardcoded bearer token
- Implementation:
  - Create environment variable `TEST_BEARER_TOKEN`
  - Update code to read from `process.env.TEST_BEARER_TOKEN`
  - Add to `.env.example`

### Task 1.2: Fix Child Process Command Injection (1 finding)
- File: `backend/scripts/backup.ts:127`
- Action: Sanitize child_process input
- Implementation:
  - Validate backup path contains only safe characters
  - Use `path.normalize()` and `path.resolve()` to prevent path traversal
  - Add input validation whitelist for allowed paths
  - Consider using `execFile` instead of `exec` for better argument passing

### Task 1.3: Fix Unsafe Format String (1 finding)
- File: `diagnostic-script.js:127`
- Action: Prevent format string injection
- Implementation:
  - Replace dynamic format strings with constant strings
  - Or escape/format variables before logging
  - Example: `console.log(`Message: ${message}`)` instead of `console.log(message)`

**Deliverables:**
- Updated test-auth-fix.js with environment variables
- Updated backup.ts with input validation
- Updated diagnostic-script.js with safe logging
- Updated .env.example

---

## Phase 2: MongoDB NoSQL Injection (Week 1-2)
**Goal:** Eliminate potential NoSQL injection vulnerabilities in database queries

### Task 2.1: Audit Database Query Patterns

#### 2.1.1: Review auth.middleware.ts
- File: `backend/src/middleware/auth.middleware.ts` (lines 44, 126)
- Action: Identify user-controlled input in database queries
- Steps:
  - Review query construction at line 44
  - Review query construction at line 126
  - Map all `req` parameters used in queries

#### 2.1.2: Review admin.routes.ts
- File: `backend/src/routes/admin.routes.ts` (lines 93, 256, 268, 279)
- Action: Identify user-controlled input in database queries
- Steps:
  - Review all 4 query locations
  - Document expected input types and formats

#### 2.1.3: Review application.routes.ts
- File: `backend/src/routes/application.routes.ts` (lines 33, 109, 166, 228)
- Action: Identify user-controlled input in database queries
- Steps:
  - Review all 4 query locations
  - Document expected input types and formats

### Task 2.2: Implement Input Validation

#### 2.2.1: Create Validation Utilities
- Create `backend/src/utils/validation.ts`
- Implement sanitization functions for:
  - String inputs (trim, escape)
  - Object IDs (validate MongoDB ObjectId format)
  - Numbers (range validation)
  - Arrays (type checking)

#### 2.2.2: Update auth.middleware.ts
- Add validation before database queries
- Implement schema validation using a library (e.g., joi, zod)
- Add unit tests for validation logic

#### 2.2.3: Update admin.routes.ts
- Add validation before database queries at all 4 locations
- Implement schema validation
- Add unit tests

#### 2.2.4: Update application.routes.ts
- Add validation before database queries at all 4 locations
- Implement schema validation
- Add unit tests

### Task 2.3: Verify NoSQL Injection Protection
- Run semgrep again to confirm fixes
- Add security tests for NoSQL injection payloads
- Update documentation

**Deliverables:**
- Input validation utilities
- Updated route handlers with validation
- Unit tests for NoSQL injection prevention
- Security test suite

---

## Phase 3: Infrastructure Security (Week 2-3)
**Goal:** Harden container and file system security

### Task 3.1: Docker Compose Security

#### 3.1.1: Add read_only to Services (17 findings)
- File: `docker-compose.yml`
- Services: postgres, redis, nginx
- Action: Add `read_only: true` to each service

Implementation steps:
```yaml
postgres:
  # ... existing config
  read_only: true
  tmpfs:
    - /tmp
    - /var/run/postgresql

redis:
  # ... existing config
  read_only: true
  tmpfs:
    - /tmp

nginx:
  # ... existing config
  read_only: true
  tmpfs:
    - /var/cache/nginx
    - /var/run
    - /tmp
```

#### 3.1.2: Add no-new-privileges to Services (17 findings)
- File: `docker-compose.yml`
- Services: postgres, redis, nginx
- Action: Add `no-new-privileges:true` to security_opt

Implementation steps:
```yaml
security_opt:
  - no-new-privileges:true
```

#### 3.1.3: Test Docker Configuration
- Build containers with new configuration
- Verify services start correctly
- Test read/write operations to temporary directories
- Update documentation if any functionality changes

### Task 3.2: Fix Path Traversal Vulnerability (1 finding)
- File: `backend/scripts/backup.ts:33`
- Action: Validate user input in path operations

Implementation steps:
- Create path sanitization function:
  - Use `path.normalize()` to resolve `..` and `.`
  - Resolve against a base directory
  - Verify the resolved path is within allowed directories
  - Add whitelist of allowed directories

Code example:
```typescript
function sanitizePath(userPath: string, baseDir: string): string {
  const resolved = path.resolve(baseDir, path.normalize(userPath));
  if (!resolved.startsWith(baseDir)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}
```

**Deliverables:**
- Updated docker-compose.yml with hardened configuration
- Updated backup.ts with path validation
- Documentation on tmpfs usage (if needed)

---

## Phase 4: Configuration & Hardening (Week 3-4)
**Goal:** Complete infrastructure hardening and clean up development files

### Task 4.1: Fix NGINX Header Redefinition (2 findings)
- File: `nginx/nginx-load-balancer.conf` (lines 109, 118)
- Action: Fix header inheritance in location blocks

Implementation options:
1. Move all headers to server block level only
2. Duplicate all headers in each location block
3. Use `always` directive for certain headers that must persist

Example approach - move to server block:
```nginx
server {
    # ... existing config
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        # Don't use add_header here if headers are at server level
        # ... existing config
    }
}
```

Test configuration:
- Run `nginx -t` to validate syntax
- Test in dev environment
- Verify headers are set correctly with curl

### Task 4.2: Update HTTP to HTTPS in Test Files (6 findings)
- Files: `backend/test-auth-fix.js`, `backend/test-validation.js`
- Action: Update or document HTTP usage

Implementation options:
1. If these tests require actual HTTP, document as such and add `.gitignore` rules
2. If tests can use HTTPS, update URLs
3. If testing local services, use `http://localhost` and document that tests are for local development only

Recommended approach:
- Create environment variable `USE_HTTPS=false` for local testing
- Update test code to use configurable protocol
- Document that tests should use HTTPS in production and CI/CD

Example:
```javascript
const protocol = process.env.USE_HTTPS === 'true' ? 'https' : 'http';
const baseUrl = `${protocol}://localhost:3000`;
```

**Deliverables:**
- Updated nginx configuration
- Updated test files with configurable protocols
- NGINX test report
- Documentation for security headers and test protocols

---

## Phase 5: Verification & Documentation (Week 4)

### Task 5.1: Run Full Semgrep Scan
- Run semgrep with same configuration as initial scan
- Verify all 111 findings are addressed
- Document any false positives (if any remain)
- Create ignore file with comments for any intentionally ignored rules

### Task 5.2: Update Security Documentation
- Create/update `SECURITY.md` with:
  - Security best practices for the codebase
  - Input validation requirements
  - Environment variables for secrets
  - Docker security hardening guidelines
  - How to report security vulnerabilities

### Task 5.3: Add Pre-commit Hooks
- Install and configure pre-commit hooks:
  - Semgrep scan before commit
  - Secret scanning (e.g., git-secrets)
  - ESLint with security rules

### Task 5.4: CI/CD Integration
- Add security scanning to CI/CD pipeline:
  - Semgrep on every pull request
  - Fail build on ERROR severity findings
  - Report WARNING severity findings as comments

### Task 5.5: Security Testing
- Add integration tests for:
  - NoSQL injection attempts
  - Path traversal attempts
  - Command injection attempts
  - Input validation edge cases

**Deliverables:**
- Clean semgrep scan report
- Updated SECURITY.md
- Pre-commit configuration
- CI/CD security pipeline
- Security test suite

---

## Summary

| Phase | Duration | Tasks | Finding Count |
|-------|----------|-------|---------------|
| Phase 1 | Week 1 | 3 tasks (Secrets, Child Process, Format String) | 3 |
| Phase 2 | Week 1-2 | 3 tasks (MongoDB NoSQLi) | 64 |
| Phase 3 | Week 2-3 | 2 tasks (Docker, Path Traversal) | 35 |
| Phase 4 | Week 3-4 | 2 tasks (NGINX, HTTP) | 8 |
| Phase 5 | Week 4 | 5 tasks (Verification, Docs, Testing) | - |
| **Total** | **4 weeks** | **15 tasks** | **111** |

## Risk Assessment by Phase

| Phase | Security Risk | Effort | Priority |
|-------|---------------|--------|----------|
| Phase 1 | Critical (secrets exposure, RCE) | Low | P0 |
| Phase 2 | Critical (data breach) | High | P0 |
| Phase 3 | Medium (container escape) | Medium | P1 |
| Phase 4 | Low-Low (config issues) | Low | P2 |
| Phase 5 | Prevention | Medium | P1 |

## Success Criteria

- [ ] All ERROR severity findings (71) resolved
- [ ] All WARNING severity findings (40) resolved or documented
- [ ] No hardcoded secrets in codebase
- [ ] Docker containers hardened with read-only filesystems
- [ ] NoSQL injection protection implemented
- [ ] Security documentation updated
- [ ] CI/CD security scanning in place
- [ ] Clean semgrep scan with zero high/critical findings