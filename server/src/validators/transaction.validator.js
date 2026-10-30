import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdValidator = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid category identifier format',
  });

export const createTransactionSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer'], {
      required_error: 'Transaction type must be income, expense, or transfer',
    }),
    amount: z
      .number({ required_error: 'Amount is required' })
      .positive({ message: 'Amount must be greater than zero' })
      .finite({ message: 'Amount must be a finite number' })
      .max(100000000, { message: 'Amount cannot exceed 100,000,000' }),
    category: objectIdValidator.optional().nullable(),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(1, { message: 'Description cannot be empty' })
      .max(150, { message: 'Description cannot exceed 150 characters' }),
    date: z
      .string({ required_error: 'Date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      }),
    paymentMethod: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'other'], {
      required_error: 'Payment method is required',
    }),
    notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
  })
  .refine(
    (data) => {
      // Income and expense must have a category
      if (data.type === 'income' || data.type === 'expense') {
        return !!data.category;
      }
      return true;
    },
    {
      message: 'Category is required for income and expense transactions',
      path: ['category'],
    }
  );

export const updateTransactionSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    amount: z
      .number()
      .positive({ message: 'Amount must be greater than zero' })
      .finite({ message: 'Amount must be a finite number' })
      .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
      .optional(),
    category: objectIdValidator.optional().nullable(),
    description: z
      .string()
      .trim()
      .min(1, { message: 'Description cannot be empty' })
      .max(150, { message: 'Description cannot exceed 150 characters' })
      .optional(),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      })
      .optional(),
    paymentMethod: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'other']).optional(),
    notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
  });

export const transactionQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Month format must be YYYY-MM' })
    .optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date format' })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date format' })
    .optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  category: objectIdValidator.optional(),
  paymentMethod: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'other']).optional(),
  search: z.string().trim().max(100).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 20)) : 20)),
  sortBy: z.enum(['date', 'amount', 'createdAt']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

