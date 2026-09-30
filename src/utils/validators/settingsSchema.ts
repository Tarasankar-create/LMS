import { z } from 'zod';

export const settingsSchema = z.object({
  loanPeriodDays: z.number().int().min(1).max(90),
  maxConcurrentLoans: z.number().int().min(1).max(10),
  finePerDay: z.number().min(0).max(100),
  maxFinePerBook: z.number().min(0).max(5000),
  reservationHoldDays: z.number().int().min(1).max(14),
  workingHours: z.object({
    open: z.string().min(1),
    close: z.string().min(1),
  }),
  academicYear: z.string().min(1),
  collegeName: z.string().min(1),
  collegeAddress: z.string().min(1),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
