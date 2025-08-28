# Security Best Practices

## Overview
This document outlines comprehensive security best practices for the Error Database application, covering infrastructure security, application security, data protection, and compliance requirements.

## Security Principles

### Core Principles
1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimum necessary access permissions
3. **Zero Trust**: Verify explicitly, never trust, always verify
4. **Secure by Default**: Default deny, secure configurations
5. **Continuous Monitoring**: Real-time security monitoring

### Security Framework
- **OWASP Top 10**: Web application security risks
- **NIST Cybersecurity Framework**: Risk management
- **ISO 27001**: Information security management
- **PCI DSS**: Payment card industry security
- **GDPR**: Data protection and privacy

## Infrastructure Security

### Network Security

#### Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL
sudo ufw enable

# Docker network isolation
docker network create --internal isolated-network
```

#### Network Segmentation
```yaml
# docker-compose network segmentation
networks:
  frontend:
    internal: false
  backend:
    internal: true
  database:
    internal: true

services:
  frontend:
    networks: [frontend]
  backend:
    networks: [frontend, backend]
  postgres:
    networks: [backend, database]
```

### Server Hardening

#### SSH Security
```bash
# SSH configuration (/etc/ssh/sshd_config)
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy-user
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Generate SSH keys
ssh-keygen -t ed25519 -C "deploy-key" -f ~/.ssh/id_ed25519
```

#### System Updates
```bash
# Automatic security updates
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Manual update check
sudo apt-get update
sudo apt-get upgrade
sudo apt-get dist-upgrade

# Kernel hardening
echo "kernel.randomize_va_space=2" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.rp_filter=1" >> /etc/sysctl.conf
```

## Application Security

### Authentication & Authorization

#### JWT Security
```typescript
// Secure JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET!, // 64+ characters
  refreshSecret: process.env.JWT_REFRESH_SECRET!, // 64+ characters
  expiresIn: '15m', // Short-lived access tokens
  refreshExpiresIn: '7d', // Longer-lived refresh tokens
  algorithm: 'HS256',
  issuer: 'errdb-api',
  audience: 'errdb-users'
};

// Token validation middleware
const validateToken = (token: string) => {
  return jwt.verify(token, jwtConfig.secret, {
    algorithms: [jwtConfig.algorithm],
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
};
```

#### Password Security
```typescript
// Password hashing with bcrypt
const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Password policy validation
function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 12) errors.push('Minimum 12 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*()_\-+=]/.test(password)) errors.push('At least one special character');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### Input Validation

#### Schema Validation
```typescript
// Zod schema validation
const userRegistrationSchema = z.object({
  email: z.string().email().max(255),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(12).max(100),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Sanitization middleware
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};
```

#### SQL Injection Prevention
```typescript
// Use parameterized queries with Prisma
async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email }
  });
}

// Raw query parameterization
async function searchErrors(query: string) {
  return prisma.$queryRaw`
    SELECT * FROM error_codes 
    WHERE message ILIKE ${`%${query}%`}
    LIMIT 50
  `;
}
```

### API Security

#### Rate Limiting
```typescript
// Express rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' // Skip localhost
});

// Per-route rate limiting
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: 'Too many login attempts'
});

app.use('/api/auth/login', authLimiter);
```

#### CORS Configuration
```typescript
// Secure CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));
```

## Data Security

### Encryption

#### Data at Rest
```sql
-- PostgreSQL encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive data
INSERT INTO users (email, password_hash, ssn_encrypted)
VALUES (
  'user@example.com',
  crypt('password', gen_salt('bf')),
  pgp_sym_encrypt('123-45-6789', 'encryption-key')
);

-- Database-level encryption
ALTER DATABASE errdb_prod SET encryption = on;
```

#### Data in Transit
```nginx
# SSL/TLS configuration (nginx)
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;

# HSTS header
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Data Classification

#### Sensitivity Levels
1. **Public**: Error codes, solutions (no restrictions)
2. **Internal**: User profiles, application metrics
3. **Confidential**: Passwords, API keys, personal data
4. **Restricted**: Financial data, authentication tokens

#### Access Controls
```sql
-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for user data access
CREATE POLICY user_access_policy ON users
FOR ALL USING (id = current_user_id());

-- Policy for admin access
CREATE POLICY admin_access_policy ON users
FOR ALL USING (current_user_role() = 'admin');
```

## Monitoring & Logging

### Security Monitoring

#### Audit Logging
```typescript
// Comprehensive audit logging
interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>;
}

// Audit middleware
app.use((req, res, next) => {
  const auditLog: Partial<AuditLog> = {
    userId: req.user?.id,
    action: req.method,
    resource: req.path,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date()
  };

  // Log to database and console
  logger.audit(auditLog);
  next();
});
```

#### Intrusion Detection
```bash
# Fail2Ban configuration
sudo apt-get install fail2ban

# jail.local configuration
[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
```

### Security Scanning

#### Dependency Scanning
```bash
# Regular dependency audits
npm audit
npm audit fix --force

# Snyk security scanning
npx snyk test
npx snyk monitor

# OWASP Dependency Check
dependency-check --project "ErrorDB" --scan ./ --out ./reports
```

#### Code Scanning
```bash
# ESLint security rules
npx eslint . --ext .ts,.tsx --config .eslintrc.security.js

# Secret scanning
gitleaks detect --source . --verbose

# Static application security testing (SAST)
npx semgrep scan --config=p/security-audit
```

## Compliance & Regulations

### GDPR Compliance

#### Data Protection
```typescript
// Right to be forgotten
async function deleteUserData(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.delete({ where: { id: userId } }),
    prisma.userSession.deleteMany({ where: { userId } }),
    prisma.solution.deleteMany({ where: { userId } }),
    prisma.vote.deleteMany({ where: { userId } })
  ]);
}

// Data export
async function exportUserData(userId: string): Promise<UserDataExport> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const solutions = await prisma.solution.findMany({ where: { userId } });
  const votes = await prisma.vote.findMany({ where: { userId } });
  
  return { user, solutions, votes };
}
```

#### Privacy by Design
```typescript
// Data minimization
interface UserRegistration {
  email: string;
  username: string;
  password: string;
  // No unnecessary fields
}

// Privacy-focused logging
const privacyLogger = {
  info: (message: string, data?: any) => {
    const sanitizedData = sanitizePii(data);
    logger.info(message, sanitizedData);
  },
  error: (message: string, error?: any) => {
    const sanitizedError = sanitizePii(error);
    logger.error(message, sanitizedError);
  }
};

function sanitizePii(data: any): any {
  if (typeof data !== 'object' || data === null) return data;
  
  const sensitiveFields = ['password', 'email', 'ssn', 'phone', 'address'];
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
}
```

### PCI DSS Compliance

#### Payment Security
```typescript
// Never store payment data
interface PaymentProcessing {
  processPayment(amount: number, token: string): Promise<PaymentResult>;
  // No storage of card details
}

// Token-based payments
async function createPaymentIntent(amount: number): Promise<PaymentIntent> {
  const paymentService = getPaymentService();
  return paymentService.createIntent(amount);
}
```

#### Access Controls
```sql
-- Payment data access restrictions
CREATE ROLE payment_processor;
GRANT SELECT, INSERT ON payments TO payment_processor;
REVOKE ALL ON payments FROM PUBLIC;

-- Audit trail for payment operations
CREATE TABLE payment_audit (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER REFERENCES payments(id),
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSONB
);
```

## Incident Response

### Security Incident Procedures

#### Incident Classification
1. **Critical**: Data breach, system compromise
2. **High**: Unauthorized access, data leakage
3. **Medium**: Vulnerability exploitation, DoS attacks
4. **Low**: Security misconfigurations, minor issues

#### Response Plan
```bash
# Incident response checklist
1. Identify and contain the incident
2. Preserve evidence for forensic analysis
3. Notify appropriate stakeholders
4. Eradicate the threat
5. Recover systems and data
6. Post-incident review and lessons learned

# Emergency contacts
SECURITY_TEAM="security@errdb.com"
LEGAL_TEAM="legal@errdb.com"
PR_TEAM="pr@errdb.com"
```

### Forensics & Investigation

#### Evidence Collection
```bash
# Preserve system state
sudo systemctl stop errdb-backend
sudo systemctl stop postgresql

# Create memory dump
sudo dd if=/dev/mem of=/evidence/memory.dump bs=1M

# Disk imaging
sudo dd if=/dev/sda of=/evidence/disk-image.img bs=4M

# Log preservation
sudo tar -czf /evidence/logs.tar.gz /var/log/
```

#### Investigation Tools
```bash
# Network analysis
tcpdump -i any -w /evidence/network.pcap

# Process analysis
ps aux > /evidence/processes.txt
lsof -n > /evidence/open-files.txt

# Timeline analysis
sudo find / -type f -printf "%T+ %p\n" 2>/dev/null | sort > /evidence/timeline.txt
```

## Security Training

### Developer Training

#### Security Awareness
- OWASP Top 10 vulnerabilities
- Secure coding practices
- Dependency management
- Incident response procedures

#### Regular Training
```bash
# Quarterly security training
security-training --topics xss,sqli,injection

# Capture the flag exercises
ctf-challenge --difficulty medium

# Code review with security focus
security-review --pull-request 123
```

### Operational Security

#### Access Management
```bash
# Principle of least privilege
sudo adduser deploy-user
sudo usermod -aG docker deploy-user

# SSH key management
ssh-keygen -t ed25519 -C "deploy-2024" -f ~/.ssh/deploy-key

# Regular access reviews
access-review --quarterly
```

#### Security Updates
```bash
# Automated security patches
unattended-upgrades --enable

# Manual security updates
security-update --critical

# Vulnerability monitoring
vulnerability-scan --daily
```

This comprehensive security best practices guide ensures that the Error Database application maintains the highest standards of security, compliance, and data protection throughout its lifecycle.