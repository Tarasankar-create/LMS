import { z } from 'zod';

export const memberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  department: z.string().min(1, 'Department is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  email: z.string().email('Enter a valid email'),
  phone: z
    .string()
    .min(10, 'Enter a valid 10-digit phone number')
    .max(10, 'Enter a valid 10-digit phone number'),
  status: z.enum(['Active', 'Inactive', 'Suspended']),
});

export type MemberFormValues = z.infer<typeof memberSchema>;
