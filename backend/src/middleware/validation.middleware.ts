import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger';

export const validateRequest = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if schema expects body structure or direct object
      const parsed = schema.parse(req.body);
      req.body = parsed; // Replace with validated data
      next();
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        // Enhanced logging with full request context
        logger.warn('Validation error:', {
          errors,
          url: req.url,
          method: req.method,
          body: req.body,
          headers: req.headers,
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.map(err => ({
              field: err.field,
              message: err.message,
            })),
          },
        });
        return;
      }

      logger.error('Unexpected validation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error during validation',
        },
      });
      return;
    }
  };
};

export const validateQuery = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate query parameters
      const parsed = schema.parse(req.query);
      req.query = parsed; // Replace with validated data
      next();
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        // Enhanced logging with full request context
        logger.warn('Query validation error:', {
          errors,
          url: req.url,
          method: req.method,
          query: req.query,
          headers: req.headers,
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors.map(err => ({
              field: err.field,
              message: err.message,
            })),
          },
        });
        return;
      }

      logger.error('Unexpected query validation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error during query validation',
        },
      });
      return;
    }
  };
};