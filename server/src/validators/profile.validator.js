import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(60, { message: 'Name cannot exceed 60 characters' })
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Please provide a valid email address' })
    .optional(),
  avatar: z
    .string()
    .trim()
    .max(500, { message: 'Avatar path/url cannot exceed 500 characters' })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, { message: 'Current password is required' }),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one numeric digit' }),
});

export const updatePreferencesSchema = z.object({
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, { message: 'Currency code must be 3 uppercase letters (e.g. INR, USD)' })
    .optional(),
  budgetStartDay: z
    .number()
    .int()
    .min(1, { message: 'Budget start day must be between 1 and 28' })
    .max(28, { message: 'Budget start day must be between 1 and 28' })
    .optional(),
  defaultSalary: z
    .number()
    .min(0, { message: 'Default salary cannot be negative' })
    .optional(),
  dashboard: z
    .object({
      showSummaryCards: z.boolean().optional(),
      showTrends: z.boolean().optional(),
      showRecentTransactions: z.boolean().optional(),
    })
    .optional(),
  notifications: z
    .object({
      budgetAlerts: z.boolean().optional(),
      loanReminders: z.boolean().optional(),
      savingsMilestones: z.boolean().optional(),
    })
    .optional(),
});

