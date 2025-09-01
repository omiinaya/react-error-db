import { z } from 'zod';

export const createSolutionSchema = z.object({
  solutionText: z.string()
    .min(10, 'Solution text must be at least 10 characters')
    .max(10000, 'Solution text must be at most 10000 characters'),
});

export const updateSolutionSchema = z.object({
  solutionText: z.string()
    .min(10, 'Solution text must be at least 10 characters')
    .max(10000, 'Solution text must be at most 10000 characters'),
});

export const voteSchema = z.object({
  voteType: z.enum(['upvote', 'downvote']),
});

export const solutionEditSchema = z.object({
  solutionText: z.string()
    .min(10, 'Solution text must be at least 10 characters')
    .max(10000, 'Solution text must be at most 10000 characters'),
  editReason: z.string()
    .min(1, 'Edit reason is required')
    .max(500, 'Edit reason must be at most 500 characters')
    .optional(),
});

export type CreateSolutionInput = z.infer<typeof createSolutionSchema>;
export type UpdateSolutionInput = z.infer<typeof updateSolutionSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type SolutionEditInput = z.infer<typeof solutionEditSchema>;