import { z } from 'zod';
import mongoose from 'mongoose';

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

const objectIdValidator = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid category identifier format',
  });

const categoryAllocationItemSchema = z.object({
  category: objectIdValidator,
  limit: z
    .number({ required_error: 'Limit is required' })
    .min(0, { message: 'Category limit cannot be negative' })
    .max(100000000, { message: 'Limit cannot exceed 100,000,000' }),
});

export const createBudgetSchema = z.object({
  month: z
    .string({ required_error: 'Month is required' })
    .regex(monthRegex, { message: 'Month must follow YYYY-MM format' }),
  expectedIncome: z
    .number({ required_error: 'Expected income is required' })
    .min(0, { message: 'Expected income cannot be negative' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' }),
  categoryAllocations: z
    .array(categoryAllocationItemSchema)
    .default([]),
  savingsTarget: z
    .number()
    .min(0, { message: 'Savings target cannot be negative' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
    .default(4000),
  bufferAllocation: z
    .number()
    .min(0, { message: 'Buffer allocation cannot be negative' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
    .default(2000),
  notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
});

export const updateBudgetSchema = z.object({
  expectedIncome: z
    .number()
    .min(0, { message: 'Expected income cannot be negative' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
    .optional(),
  categoryAllocations: z.array(categoryAllocationItemSchema).optional(),
  savingsTarget: z
    .number()
    .min(0, { message: 'Savings target cannot be negative' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
    .optional(),
  bufferAllocation: z
    .number()
    .min(0, { message: 'Buffer allocation cannot be negative' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
    .optional(),
  notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
});

export const copyBudgetSchema = z.object({
  sourceMonth: z
    .string({ required_error: 'Source month is required' })
    .regex(monthRegex, { message: 'Source month must follow YYYY-MM format' }),
  targetMonth: z
    .string({ required_error: 'Target month is required' })
    .regex(monthRegex, { message: 'Target month must follow YYYY-MM format' }),
});

