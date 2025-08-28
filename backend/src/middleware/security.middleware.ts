import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { config } from '../config';

// Extend Express Request type to include custom properties
declare global {
  namespace Express {
    interface Request {
      user?: any;
      rateLimit?: {
        windowMs: number;
        max: number;
      };
    }
  }
}

/**
 * Security middleware that enhances Helmet with additional security headers
 * and Content Security Policy (CSP) configuration
 */
export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Enhanced CSP configuration
  const cspConfig = {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some legacy browsers
        "'unsafe-eval'",   // Required for some frameworks
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://cdnjs.cloudflare.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for inline styles
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "data:",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
      ],
      connectSrc: [
        "'self'",
        config.frontendUrl,
        "https://api.sentry.io",
        "wss://*.sentry.io",
      ],
      frameSrc: ["'none'"], // Disable iframes
      objectSrc: ["'none'"], // Disable plugins
      mediaSrc: ["'self'"],
      frameAncestors: ["'none'"], // Prevent clickjacking
      formAction: ["'self'"],
      baseUri: ["'self'"],
      reportUri: config.nodeEnv === 'production' ? '/api/security/csp-report' : null,
    },
    reportOnly: config.nodeEnv !== 'production', // Report only in development
  };

  // Apply enhanced security headers
  helmet({
    contentSecurityPolicy: cspConfig,
    crossOriginEmbedderPolicy: { policy: "require-corp" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-site" },
    originAgentCluster: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    xContentTypeOptions: true,
    xDnsPrefetchControl: { allow: false },
    xDownloadOptions: true,
    xFrameOptions: { action: "deny" },
    xPermittedCrossDomainPolicies: { permittedPolicies: "none" },
    xXssProtection: false, // Disable deprecated X-XSS-Protection header
  })(req, res, next);
};

/**
 * Additional security headers beyond Helmet's defaults
 */
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent IE from executing downloads in site context
  res.setHeader('X-Download-Options', 'noopen');
  
  // Disable browser caching for sensitive pages
  if (req.path.includes('/auth') || req.path.includes('/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  
  // Permissions policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy', 
    'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), ' +
    'display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), ' +
    'gamepad=(), geolocation=(), gyroscope=(), layout-animations=(), legacy-image-formats=(), ' +
    'magnetometer=(), microphone=(), midi=(), oversized-images=(), payment=(), ' +
    'picture-in-picture=(), publickey-credentials-get=(), sync-xhr=(), usb=(), ' +
    'vr=(), wake-lock=(), screen-wake-lock=(), web-share=(), xr-spatial-tracking=()'
  );
  
  // Expect-CT header (Certificate Transparency)
  if (config.nodeEnv === 'production') {
    res.setHeader('Expect-CT', 'max-age=86400, enforce, report-uri="/api/security/ct-report"');
  }
  
  next();
};

/**
 * Rate limiting configuration per endpoint
 */
export const endpointSpecificRateLimiting = (req: Request, res: Response, next: NextFunction) => {
  // Stricter rate limits for authentication endpoints
  if (req.path.includes('/auth')) {
    req.rateLimit = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.nodeEnv === 'production' ? 5 : 20, // 5 attempts in production
    };
  }
  
  // Stricter rate limits for admin endpoints
  if (req.path.includes('/admin')) {
    req.rateLimit = {
      windowMs: 15 * 60 * 1000,
      max: config.nodeEnv === 'production' ? 10 : 50,
    };
  }
  
  // Stricter rate limits for API endpoints
  if (req.path.startsWith('/api')) {
    req.rateLimit = {
      windowMs: 15 * 60 * 1000,
      max: config.nodeEnv === 'production' ? 100 : 1000,
    };
  }
  
  next();
};

/**
 * Security logging middleware
 */
export const securityLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const securityRelevantHeaders = [
    'x-forwarded-for',
    'user-agent',
    'referer',
    'origin',
    'x-real-ip',
  ];
  
  const securityContext = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    method: req.method,
    path: req.path,
    headers: securityRelevantHeaders.reduce((acc, header) => {
      if (req.headers[header]) {
        acc[header] = req.headers[header];
      }
      return acc;
    }, {} as Record<string, any>),
    user: req.user ? { id: (req.user as any).id } : undefined,
  };
  
  // Log security-relevant requests
  if (req.path.includes('/auth') || req.path.includes('/admin')) {
    console.log('Security event:', securityContext);
  }
  
  next();
};

/**
 * CSP violation report endpoint
 */
export const cspReportHandler = (req: Request, res: Response) => {
  if (req.body && config.nodeEnv !== 'production') {
    console.warn('CSP Violation:', req.body);
  }
  
  res.status(204).send();
};

/**
 * XSS violation report endpoint
 */
export const xssReportHandler = (req: Request, res: Response) => {
  if (req.body && config.nodeEnv !== 'production') {
    console.warn('XSS Violation:', req.body);
  }
  
  res.status(204).send();
};

/**
 * Certificate Transparency report endpoint
 */
export const ctReportHandler = (req: Request, res: Response) => {
  if (req.body && config.nodeEnv !== 'production') {
    console.warn('CT Violation:', req.body);
  }
  
  res.status(204).send();
};

/**
 * Security headers test endpoint
 */
export const securityHeadersTest = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      headers: {
        'X-Content-Type-Options': res.getHeader('X-Content-Type-Options'),
        'X-Frame-Options': res.getHeader('X-Frame-Options'),
        'X-XSS-Protection': res.getHeader('X-XSS-Protection'),
        'Strict-Transport-Security': res.getHeader('Strict-Transport-Security'),
        'Content-Security-Policy': res.getHeader('Content-Security-Policy'),
        'Permissions-Policy': res.getHeader('Permissions-Policy'),
      },
      recommendations: {
        missingHeaders: [],
        improvements: [],
      },
    },
  });
};

export default {
  securityMiddleware,
  additionalSecurityHeaders,
  endpointSpecificRateLimiting,
  securityLoggingMiddleware,
  cspReportHandler,
  xssReportHandler,
  ctReportHandler,
  securityHeadersTest,
};