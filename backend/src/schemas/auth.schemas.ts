import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .optional()
    .or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .optional()
    .or(z.literal('')),
  avatarUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

export const updateThemePreferenceSchema = z.object({
  themePreference: z.enum(['light', 'dark'], {
    errorMap: () => ({ message: 'Theme preference must be either "light" or "dark"' })
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateThemePreferenceInput = z.infer<typeof updateThemePreferenceSchema>;