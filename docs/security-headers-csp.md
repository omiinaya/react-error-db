# Security Headers and CSP Configuration Guide

## Overview
The Error Database application implements comprehensive security headers and Content Security Policy (CSP) to protect against common web vulnerabilities including XSS, clickjacking, and other attacks.

## Security Headers Configuration

### Implemented Headers

#### 1. Content Security Policy (CSP)
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com;
  font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://unpkg.com data:;
  img-src 'self' data: blob: https:;
  connect-src 'self' http://localhost:3005 https://api.sentry.io wss://*.sentry.io;
  frame-src 'none';
  object-src 'none';
  media-src 'self';
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
```

#### 2. Strict Transport Security (HSTS)
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

#### 3. X-Content-Type-Options
```http
X-Content-Type-Options: nosniff
```

#### 4. X-Frame-Options
```http
X-Frame-Options: DENY
```

#### 5. Permissions Policy
```http
Permissions-Policy: 
  accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), 
  display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), 
  gamepad=(), geolocation=(), gyroscope=(), layout-animations=(), legacy-image-formats=(), 
  magnetometer=(), microphone=(), midi=(), oversized-images=(), payment=(), 
  picture-in-picture=(), publickey-credentials-get=(), sync-xhr=(), usb=(), 
  vr=(), wake-lock=(), screen-wake-lock=(), web-share=(), xr-spatial-tracking=()
```

#### 6. Referrer Policy
```http
Referrer-Policy: strict-origin-when-cross-origin
```

#### 7. Other Headers
```http
X-Download-Options: noopen
X-Permitted-Cross-Domain-Policies: none
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
```

## CSP Directives Explained

### default-src
- **'self'**: Only allow resources from the same origin
- **Purpose**: Fallback for other directives

### script-src
- **'self'**: Scripts from same origin
- **'unsafe-inline'**: Allow inline scripts (required for some frameworks)
- **'unsafe-eval'**: Allow eval() (required for some libraries)
- **CDNs**: Trusted content delivery networks

### style-src
- **'self'**: Styles from same origin
- **'unsafe-inline'**: Allow inline styles
- **Google Fonts**: Allow font stylesheets

### font-src
- **'self'**: Fonts from same origin
- **Google Fonts**: Allow font downloads
- **data:**: Allow data URIs for fonts

### img-src
- **'self'**: Images from same origin
- **data:**: Data URIs for images
- **blob:**: Blob URLs
- **https:**: All HTTPS sources

### connect-src
- **'self'**: API calls to same origin
- **Frontend URL**: Allow connections to frontend
- **Sentry**: Error reporting and monitoring

### Security Restrictions
- **frame-src 'none'**: Disable iframes completely
- **object-src 'none'**: Disable plugins (Flash, Java)
- **frame-ancestors 'none'**: Prevent clickjacking

## Environment-Specific Configuration

### Development
```typescript
// CSP reports only (no enforcement)
reportOnly: true
```

### Production  
```typescript
// Full enforcement with reporting
reportOnly: false
reportUri: '/api/security/csp-report'
```

## Reporting Endpoints

### CSP Violation Reports
**Endpoint**: `POST /api/security/csp-report`
- Logs CSP violations in development
- Ignored in production (configure external reporting)

### XSS Violation Reports  
**Endpoint**: `POST /api/security/xss-report`
- Logs potential XSS attacks
- Development debugging only

### Certificate Transparency Reports
**Endpoint**: `POST /api/security/ct-report`
- SSL/TLS certificate monitoring
- Development debugging only

## Testing Security Headers

### Test Endpoint
**Endpoint**: `GET /api/security/headers-test`
```json
{
  "success": true,
  "data": {
    "headers": {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
      "Content-Security-Policy": "...",
      "Permissions-Policy": "..."
    },
    "recommendations": {
      "missingHeaders": [],
      "improvements": []
    }
  }
}
```

### Manual Testing
```bash
# Test headers with curl
curl -I http://localhost:3010/api/health

# Test specific endpoint
curl -I http://localhost:3010/api/security/headers-test

# Test with SSL Labs (production)
# https://www.ssllabs.com/ssltest/
```

## Integration with Monitoring

### Sentry Integration
- CSP violations can be forwarded to Sentry
- Real-time alerting for security events
- Correlation with application errors

### Logging
- Security-relevant requests are logged
- Authentication attempts tracked
- Admin access monitored

## Customization

### Modifying CSP
```typescript
// Custom CSP configuration
const customCSP = {
  directives: {
    scriptSrc: [
      "'self'",
      "https://your-cdn.example.com",
    ],
    // ... other directives
  }
};
```

### Adding New Headers
```typescript
// Custom security header
res.setHeader('X-Custom-Security-Policy', 'your-policy');
```

### Environment-specific Rules
```typescript
// Different rules for different environments
if (config.nodeEnv === 'development') {
  // More permissive rules for development
} else {
  // Strict rules for production
}
```

## Best Practices

### CSP Implementation
1. **Start with Report-Only**: Begin with `reportOnly: true`
2. **Monitor Violations**: Address all reported violations
3. **Gradual Enforcement**: Move to enforcement gradually
4. **Regular Review**: Periodically review and update policies

### Header Configuration
1. **Minimum Privilege**: Grant minimum necessary permissions
2. **HTTPS Enforcement**: Always use HSTS in production
3. **Frame Protection**: Prevent clickjacking with frame options
4. **MIME Sniffing**: Disable MIME type sniffing

### Maintenance
1. **Regular Audits**: Conduct security header audits
2. **Dependency Updates**: Update policies for new dependencies
3. **Monitoring**: Continuously monitor for violations
4. **Documentation**: Keep policies documented and accessible

## Troubleshooting

### Common Issues

#### CSP Violations
- **Missing Sources**: Add required domains to appropriate directives
- **Inline Code**: Use nonces or hashes for inline code
- **Dynamic Content**: Adjust policies for dynamic content

#### Header Conflicts
- **Multiple Headers**: Ensure no conflicting headers
- **Proxy Interference**: Check reverse proxy configurations
- **CDN Settings**: Verify CDN security header settings

#### Browser Compatibility
- **Legacy Browsers**: Some headers not supported in older browsers
- **Feature Detection**: Use feature detection for progressive enhancement

### Debugging
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Check browser console for CSP violations
# Use browser dev tools to inspect headers

# Test with security header scanners
# https://securityheaders.com/
```

## Tools and Resources

### Testing Tools
- [SecurityHeaders.com](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

### Documentation
- [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Helmet.js Documentation](https://helmetjs.github.io/)

### Monitoring
- [Sentry CSP Reporting](https://docs.sentry.io/product/security-policy-reporting/)
- [Report-URI](https://report-uri.com/)
- [Google CSP Reporter](https://csp.withgoogle.com/docs/index.html)

## Compliance

### Security Standards
- **OWASP Top 10**: Protects against XSS, clickjacking, etc.
- **PCI DSS**: Meets payment card industry requirements
- **GDPR**: Supports data protection requirements
- **ISO 27001**: Aligns with information security standards

### Regular Audits
- Quarterly security header audits
- Penetration testing inclusion
- Compliance verification
- Policy review and updates

This security configuration provides robust protection against common web vulnerabilities while maintaining flexibility for development and production needs.