import { z } from 'zod';

export const createCategoryRequestSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
  icon: z.string().max(50, 'Icon must be at most 50 characters').optional().or(z.literal('')),
  parentId: z.string().uuid('Invalid parent category ID').optional().nullable(),
});

export const updateCategoryRequestStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason must be at most 500 characters')
    .optional()
    .or(z.literal(''))
    .refine(val => val !== undefined && val !== null, {
      message: 'Reason is required when rejecting a request'
    })
    .transform(val => val || '')
});

export const categoryRequestQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
  page: z.string().transform(Number).pipe(z.number().min(1).default(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100).default(20)).optional(),
  search: z.string().min(1, 'Search query cannot be empty').optional(),
});

export type CreateCategoryRequestInput = z.infer<typeof createCategoryRequestSchema>;
export type UpdateCategoryRequestStatusInput = z.infer<typeof updateCategoryRequestStatusSchema>;
export type CategoryRequestQueryInput = z.infer<typeof categoryRequestQuerySchema>;