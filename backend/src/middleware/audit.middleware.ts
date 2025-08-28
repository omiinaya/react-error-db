import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { logger } from '../utils/logger';
import prisma from '../services/database.service';

export interface AuditLog {
  action: string;
  resource: string;
  resourceId?: string | null;
  userId: string;
  userIp?: string | null;
  userAgent?: string | null;
  details?: any;
  status: 'success' | 'failure';
}

export const auditMiddleware = (action: string, resource: string, getResourceId?: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    // Store response data for logging
    let responseBody: any;
    
    // Override res.send to capture response
    res.send = function(body: any): Response {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.on('finish', async () => {
      try {
        const authenticatedReq = req as AuthenticatedRequest;
        const userId = authenticatedReq.user?.id || 'anonymous';
        
        const auditLog: AuditLog = {
          action,
          resource,
          resourceId: getResourceId ? getResourceId(req) : null,
          userId,
          userIp: req.ip || req.connection.remoteAddress || null,
          userAgent: req.get('User-Agent') || null,
          details: {
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
            statusCode: res.statusCode,
            responseTime: Date.now() - startTime,
            response: responseBody && typeof responseBody === 'object'
              ? { success: responseBody.success, message: responseBody.message }
              : undefined
          },
          status: res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failure'
        };

        // Log to console
        logger.info('Audit log:', {
          action: auditLog.action,
          resource: auditLog.resource,
          userId: auditLog.userId,
          status: auditLog.status,
          statusCode: res.statusCode
        });

        // Store in database (optional - you might want to store only critical actions)
        if (auditLog.action.startsWith('admin.')) {
          try {
            await (prisma as any).auditLog.create({
              data: {
                action: auditLog.action,
                resource: auditLog.resource,
                resourceId: auditLog.resourceId,
                userId: auditLog.userId,
                userIp: auditLog.userIp,
                userAgent: auditLog.userAgent,
                details: auditLog.details,
                status: auditLog.status
              }
            });
          } catch (dbError) {
            logger.error('Failed to save audit log to database:', dbError);
          }
        }

      } catch (error) {
        logger.error('Error in audit middleware:', error);
      }
    });

    next();
  };
};

// Helper function to create audit middleware for common admin actions
export const adminAudit = (action: string, resource: string, getResourceId?: (req: Request) => string) => {
  return auditMiddleware(`admin.${action}`, resource, getResourceId);
};