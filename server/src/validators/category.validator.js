import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(1, { message: 'Category name cannot be empty' })
    .max(50, { message: 'Category name cannot exceed 50 characters' }),
  type: z.enum(['income', 'expense'], {
    required_error: 'Category type must be either income or expense',
  }),
  icon: z.string().trim().max(30).optional().default('tag'),
  color: z.string().trim().max(20).optional().default('#10b981'),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Category name cannot be empty' })
    .max(50, { message: 'Category name cannot exceed 50 characters' })
    .optional(),
  icon: z.string().trim().max(30).optional(),
  color: z.string().trim().max(20).optional(),
});

