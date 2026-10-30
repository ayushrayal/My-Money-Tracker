import { z } from 'zod';
import mongoose from 'mongoose';

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

const objectIdValidator = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid identifier format',
  });

export const createLoanSchema = z.object({
  lenderName: z
    .string({ required_error: 'Lender name is required' })
    .trim()
    .min(1, { message: 'Lender name cannot be empty' })
    .max(100, { message: 'Lender name cannot exceed 100 characters' }),
  originalPrincipal: z
    .number({ required_error: 'Original principal is required' })
    .positive({ message: 'Principal must be greater than zero' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' }),
  startDate: z
    .string({ required_error: 'Start date is required' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date format' }),
  plannedMonthlyPayment: z
    .number()
    .min(0, { message: 'Planned monthly payment cannot be negative' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
    .default(0),
  firstScheduledPaymentMonth: z
    .string()
    .regex(monthRegex, { message: 'First scheduled payment month must follow YYYY-MM format' })
    .optional()
    .nullable(),
  notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
});

export const updateLoanSchema = z.object({
  lenderName: z
    .string()
    .trim()
    .min(1, { message: 'Lender name cannot be empty' })
    .max(100, { message: 'Lender name cannot exceed 100 characters' })
    .optional(),
  plannedMonthlyPayment: z
    .number()
    .min(0, { message: 'Planned payment cannot be negative' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
    .optional(),
  firstScheduledPaymentMonth: z
    .string()
    .regex(monthRegex, { message: 'First scheduled payment month must follow YYYY-MM format' })
    .optional()
    .nullable(),
  status: z.enum(['active', 'paid', 'paused', 'archived']).optional(),
  notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
});

export const createLoanPaymentSchema = z.object({
  amount: z
    .number({ required_error: 'Payment amount is required' })
    .positive({ message: 'Payment amount must be greater than zero' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' }),
  paymentDate: z
    .string({ required_error: 'Payment date is required' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid payment date format' }),
  recordAsExpense: z.boolean().default(true),
  createTransaction: z.boolean().optional(),
  paymentMethod: z
    .enum(['bank_transfer', 'upi', 'cash', 'card', 'other'])
    .default('upi'),
  notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
});

export const updateLoanPaymentSchema = z.object({
  amount: z
    .number()
    .positive({ message: 'Payment amount must be greater than zero' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
    .optional(),
  paymentDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid payment date format' })
    .optional(),
  notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
});
