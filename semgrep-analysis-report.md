# Semgrep Codebase Analysis Report

**Date:** 2026-02-06
**Total Findings:** 111
**Analysis Type:** Code Smells and Security Issues

## Executive Summary

The semgrep analysis revealed 111 findings across the codebase. All findings are security-related issues that should be reviewed and addressed. The issues are categorized by severity and type below.

## Findings by Category

| Rule Category | Count |
|---------------|-------|
| Security | 111 |

## Findings by Rule Type

| Rule ID | Count | Severity |
|---------|-------|----------|
| express.mongodb.express-mongo-nosqli | 64 | ERROR |
| docker-compose.security.writable-filesystem-service | 17 | WARNING |
| docker-compose.security.no-new-privileges | 17 | WARNING |
| rest-http-client-support | 6 | WARNING |
| nginx.security.header-redefinition | 2 | WARNING |
| secrets.security.detected-jwt-token | 1 | ERROR |
| lang.security.detect-child-process | 1 | ERROR |
| lang.security.audit.unsafe-formatstring | 1 | ERROR |
| lang.security.audit.path-traversal | 1 | WARNING |
| lang.hardcoded.headers.hardcoded-bearer-token | 1 | ERROR |

## Detailed Findings

### 1. MongoDB NoSQL Injection (64 findings)
**Rule:** `express.mongodb.express-mongo-nosqli`
**Severity:** ERROR
**Locations:**
- `backend/src/middleware/auth.middleware.ts` (lines 44, 126)
- `backend/src/routes/admin.routes.ts` (lines 93, 256, 268, 279)
- `backend/src/routes/application.routes.ts` (lines 33, 109, 166, 228)

**Description:** Detected database query statements that receive data from `req` arguments. This could lead to NoSQL injection if the variable is user-controlled and is not properly sanitized.

**Recommendation:** Sanitize or validate all user input before passing it to database queries. Use parameterized queries or an ORM with built-in injection protection.

---

### 2. Docker Compose Writable Filesystem Service (17 findings)
**Rule:** `docker-compose.security.writable-filesystem-service.writable-filesystem-service`
**Severity:** WARNING
**Locations:**
- `docker-compose.yml` - Services: postgres, redis, nginx

**Description:** Services are running with a writable root filesystem. This may allow malicious applications to download and run additional payloads, or modify container files.

**Recommendation:** Add `read_only: true` to these services. If applications need to save data temporarily, consider using a tmpfs volume instead.

---

### 3. Docker Compose No New Privileges (17 findings)
**Rule:** `docker-compose.security.no-new-privileges.no-new-privileges`
**Severity:** WARNING
**Locations:**
- `docker-compose.yml` - Services: postgres, redis, nginx

**Description:** Services allow for privilege escalation via setuid or setgid binaries.

**Recommendation:** Add `'no-new-privileges:true'` in `security_opt` to prevent privilege escalation.

---

### 4. Insecure HTTP Requests (6 findings)
**Rule:** `problem-based-packs.insecure-transport.js-node.rest-http-client-support`
**Severity:** WARNING
**Locations:**
- `backend/test-auth-fix.js` (lines 14, 49)
- `backend/test-validation.js` (lines 13, 35, 57, 79)

**Description:** Checks for requests to http (unencrypted) sites using popular REST/HTTP libraries.

**Recommendation:** Use HTTPS instead of HTTP for all external requests. If testing is required, consider using environment variables to configure the protocol.

---

### 5. NGINX Header Redefinition (2 findings)
**Rule:** `generic.nginx.security.header-redefinition.header-redefinition`
**Severity:** WARNING
**Locations:**
- `nginx/nginx-load-balancer.conf` (lines 109, 118)

**Description:** The `add_header` directive is called in a `location` block after headers have been set at the server block. This will overwrite the headers defined in the server block.

**Recommendation:** Either explicitly set all headers in each location block, or set all headers at the server block level only.

---

### 6. Hardcoded JWT Token (1 finding)
**Rule:** `generic.secrets.security.detected-jwt-token.detected-jwt-token`
**Severity:** ERROR
**Location:** `backend/test-auth-fix.js:11`

**Description:** JWT token detected in the code.

**Recommendation:** Remove the hardcoded JWT token. Use environment variables or a secure vault for storing sensitive tokens.

---

### 7. Hardcoded Bearer Token (1 finding)
**Rule:** `lang.hardcoded.headers.hardcoded-bearer-token.hardcoded-bearer-token`
**Severity:** ERROR
**Location:** `backend/test-auth-fix.js:18`

**Description:** A secret is hard-coded in the application. Secrets stored in source code can be leaked.

**Recommendation:** Remove the hardcoded token. Use environment variables to securely provide credentials.

---

### 8. Child Process Command Injection (1 finding)
**Rule:** `lang.security.detect-child-process.detect-child-process`
**Severity:** ERROR
**Location:** `backend/scripts/backup.ts:127`

**Description:** Detected calls to child_process from a function argument. This could lead to command injection if the input is user-controllable.

**Recommendation:** Sanitize or validate all input passed to child_process functions. Consider using safer alternatives if possible.

---

### 9. Unsafe Format String (1 finding)
**Rule:** `lang.security.audit.unsafe-formatstring.unsafe-formatstring`
**Severity:** ERROR
**Location:** `diagnostic-script.js:127`

**Description:** Detected string concatenation with a non-literal variable in a util.format/console.log function. If an attacker injects a format specifier, it will forge the log message.

**Recommendation:** Use constant values for the format string to prevent format string injection.

---

### 10. Path Traversal Vulnerability (1 finding)
**Rule:** `lang.security.audit.path-traversal.path-join-resolve-traversal`
**Severity:** WARNING
**Location:** `backend/scripts/backup.ts:33`

**Description:** Detected possible user input going into a `path.join` or `path.resolve` function. This could lead to a path traversal vulnerability.

**Recommendation:** Sanitize or validate user input before using it in path operations.

---

## Priority Recommendations

### High Priority (Immediate Action Required)
1. **MongoDB NoSQL Injection (64 issues)** - Critical security vulnerability that could lead to data breaches
2. **Hardcoded Secrets (3 issues)** - Remove JWT and bearer tokens from code
3. **Child Process Injection** - Prevent command execution vulnerabilities

### Medium Priority
1. **Docker Compose Security (34 issues)** - Add `read_only: true` and `no-new-privileges:true` to services
2. **Path Traversal** - Validate user input in file path operations

### Low Priority
1. **NGINX Header Configuration** - Fix header inheritance in location blocks
2. **Insecure HTTP** - Upgrade to HTTPS in test files (if applicable)

## Summary

The codebase has 111 security findings that need attention. The most critical issues are the potential NoSQL injection vulnerabilities (64 findings) in the backend routes and middleware. These should be addressed immediately as they could allow attackers to manipulate database queries.

Additionally, hardcoded secrets should be removed and sensitive data should be moved to environment variables or a secure vault. Docker Compose configurations should be hardened to reduce the attack surface for containerized services.