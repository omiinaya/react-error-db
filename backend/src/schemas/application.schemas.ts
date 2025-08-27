import { z } from 'zod';

export const createApplicationSchema = z.object({
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
  logoUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  categoryId: z.string().uuid('Invalid category ID'),
  websiteUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  documentationUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

export const updateApplicationSchema = createApplicationSchema.partial();

export const applicationQuerySchema = z.object({
  categoryId: z.string().uuid('Invalid category ID').optional(),
  search: z.string().min(1, 'Search query cannot be empty').optional(),
  page: z.string().transform(Number).pipe(z.number().min(1).default(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100).default(20)).optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationQueryInput = z.infer<typeof applicationQuerySchema>;