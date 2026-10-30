import { z } from 'zod';

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const createSalarySchema = z.object({
  month: z
    .string({ required_error: 'Month is required' })
    .regex(monthRegex, { message: 'Month must follow YYYY-MM format' }),
  plannedAmount: z
    .number({ required_error: 'Planned amount is required' })
    .min(0, { message: 'Planned amount cannot be negative' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' }),
  notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
});

export const receiveSalarySchema = z
  .object({
    month: z
      .string({ required_error: 'Month is required' })
      .regex(monthRegex, { message: 'Month must follow YYYY-MM format' }),
    actualAmount: z
      .number()
      .positive({ message: 'Actual amount must be greater than zero' })
      .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
      .optional(),
    receivedAmount: z
      .number()
      .positive({ message: 'Received amount must be greater than zero' })
      .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
      .optional(),
    receivedDate: z
      .string({ required_error: 'Received date is required' })
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid received date format' }),
    paymentMethod: z
      .enum(['bank_transfer', 'upi', 'cash', 'card', 'other'], {
        required_error: 'Payment method is required',
      })
      .default('bank_transfer'),
    notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
  })
  .refine((data) => data.actualAmount !== undefined || data.receivedAmount !== undefined, {
    message: 'Actual salary amount is required',
    path: ['actualAmount'],
  });

export const updateSalarySchema = z.object({
  plannedAmount: z
    .number()
    .min(0, { message: 'Planned amount cannot be negative' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
    .optional(),
  actualAmount: z
    .number()
    .positive({ message: 'Actual amount must be greater than zero' })
    .max(100000000, { message: 'Amount cannot exceed 100,000,000' })
    .optional(),
  receivedDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid received date format' })
    .optional(),
  paymentMethod: z
    .enum(['bank_transfer', 'upi', 'cash', 'card', 'other'])
    .optional(),
  notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
});

export const addAdditionalIncomeSchema = z
  .object({
    month: z
      .string({ required_error: 'Month is required' })
      .regex(monthRegex, { message: 'Month must follow YYYY-MM format' }),
    source: z
      .string({ required_error: 'Source name is required' })
      .trim()
      .min(1, { message: 'Source cannot be empty' })
      .max(100, { message: 'Source cannot exceed 100 characters' }),
    amount: z
      .number({ required_error: 'Amount is required' })
      .positive({ message: 'Amount must be greater than zero' })
      .max(100000000, { message: 'Amount cannot exceed 100,000,000' }),
    receivedDate: z.string().optional(),
    date: z.string().optional(),
    paymentMethod: z
      .enum(['bank_transfer', 'upi', 'cash', 'card', 'other'])
      .default('bank_transfer'),
    notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
  })
  .refine((data) => data.receivedDate !== undefined || data.date !== undefined, {
    message: 'Date is required',
    path: ['date'],
  });
