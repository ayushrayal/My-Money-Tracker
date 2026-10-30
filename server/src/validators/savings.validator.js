import { z } from 'zod';
import mongoose from 'mongoose';

const milestoneItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  targetAmount: z.number().positive(),
  achieved: z.boolean().default(false),
  achievedDate: z.string().nullable().optional(),
});

export const createSavingsGoalSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    name: z.string().trim().min(1).max(100).optional(),
    targetAmount: z
      .number({ required_error: 'Target amount is required' })
      .positive({ message: 'Target amount must be greater than zero' })
      .max(100000000, { message: 'Amount cannot exceed 100,000,000' }),
    targetDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid target date format' })
      .optional()
      .nullable(),
    category: z
      .enum(['emergency_fund', 'general', 'vacation', 'gadget', 'education', 'other'])
      .default('general'),
    monthlyTarget: z.number().min(0).default(0),
    milestones: z.array(milestoneItemSchema).optional(),
    notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
  })
  .refine((data) => data.title !== undefined || data.name !== undefined, {
    message: 'Goal title is required',
    path: ['title'],
  });

export const updateSavingsGoalSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  targetAmount: z.number().positive().max(100000000).optional(),
  targetDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid target date format' })
    .optional()
    .nullable(),
  category: z
    .enum(['emergency_fund', 'general', 'vacation', 'gadget', 'education', 'other'])
    .optional(),
  monthlyTarget: z.number().min(0).optional(),
  milestones: z.array(milestoneItemSchema).optional(),
  isArchived: z.boolean().optional(),
  notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
});

export const createSavingsContributionSchema = z
  .object({
    amount: z
      .number({ required_error: 'Contribution amount is required' })
      .positive({ message: 'Contribution amount must be greater than zero' })
      .max(100000000, { message: 'Amount cannot exceed 100,000,000' }),
    date: z.string().optional(),
    contributionDate: z.string().optional(),
    paymentMethod: z
      .enum(['bank_transfer', 'upi', 'cash', 'card', 'other'])
      .default('bank_transfer'),
    recordAsTransfer: z.boolean().default(false),
    notes: z.string().trim().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
  })
  .refine((data) => data.date !== undefined || data.contributionDate !== undefined, {
    message: 'Contribution date is required',
    path: ['date'],
  });
