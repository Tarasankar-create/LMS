import { z } from 'zod';

export const loginSchema = z.object({
  kind: z.enum(['staff', 'student']),
  username: z.string().min(1, 'Username / Roll number is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
