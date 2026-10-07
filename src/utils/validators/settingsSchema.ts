import { z } from 'zod';

export const settingsSchema = z.object({
  loanPeriodDays: z.number().int('Must be a whole number of days').min(1, 'Minimum 1 day').max(90, 'Maximum 90 days'),
  maxConcurrentLoans: z.number().int('Must be a whole number').min(1, 'Minimum 1 book').max(10, 'Maximum 10 books'),
  maxRenewalsPerLoan: z.number().int('Must be a whole number').min(0, 'Minimum 0 renewals').max(5, 'Maximum 5 renewals'),
  finePerDay: z.number().min(0, 'Fine cannot be negative').max(100, 'Maximum ₹100 per day'),
  maxFinePerBook: z.number().min(0, 'Max fine cannot be negative').max(5000, 'Maximum ₹5,000 per book'),
  blockFineThreshold: z.number().min(0, 'Threshold cannot be negative').max(10000, 'Maximum ₹10,000'),
  blockOverdueDays: z.number().int('Must be a whole number of days').min(1, 'Minimum 1 day').max(90, 'Maximum 90 days'),
  reservationHoldDays: z.number().int('Must be a whole number of days').min(1, 'Minimum 1 day').max(14, 'Maximum 14 days'),
  dueReminderLeadDays: z.number().int('Must be a whole number of days').min(1, 'Minimum 1 day').max(14, 'Maximum 14 days'),
  workingHours: z.object({
    open: z.string().min(1, 'Opening time is required'),
    close: z.string().min(1, 'Closing time is required'),
  }),
  academicYear: z.string().min(1, 'Academic year is required'),
  collegeName: z.string().min(1, 'College name is required'),
  collegeAddress: z.string().min(1, 'College address is required'),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
