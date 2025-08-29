import { z } from 'zod';

export const createCategorySchema = z.object({
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
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryQuerySchema = z.object({
  parentId: z.string().uuid('Invalid parent category ID').optional(),
  includeChildren: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  search: z.string().min(1, 'Search query cannot be empty').optional(),
  page: z.string().transform(Number).pipe(z.number().min(1).default(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100).default(20)).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;