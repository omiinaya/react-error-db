import { z } from 'zod';

export const errorCodeQuerySchema = z.object({
  applicationId: z.string().uuid('Invalid application ID').optional(),
  search: z.string().min(1, 'Search query cannot be empty').optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  sort: z.enum(['createdAt', 'views', 'title', 'recent']).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1).default(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100).default(20)).optional(),
});

export const createErrorCodeSchema = z.object({
  code: z.string()
    .min(1, 'Error code is required')
    .max(50, 'Error code must be at most 50 characters'),
  applicationId: z.string().uuid('Invalid application ID'),
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(255, 'Title must be at most 255 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be at most 5000 characters')
    .optional()
    .or(z.literal('')),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  metadata: z.record(z.any()).optional(),
});

export const updateErrorCodeSchema = createErrorCodeSchema.partial();

export type ErrorCodeQueryInput = z.infer<typeof errorCodeQuerySchema>;
export type CreateErrorCodeInput = z.infer<typeof createErrorCodeSchema>;
export type UpdateErrorCodeInput = z.infer<typeof updateErrorCodeSchema>;