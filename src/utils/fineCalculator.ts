import { overdueDays } from './date';
import type { LibrarySettings } from '@/types';

export function calculateFine(
  dueDateISO: string,
  settings: Pick<LibrarySettings, 'finePerDay' | 'maxFinePerBook'>,
  asOfISO?: string,
): { days: number; amount: number } {
  const days = overdueDays(dueDateISO, asOfISO);
  const amount = Math.min(days * settings.finePerDay, settings.maxFinePerBook);
  return { days, amount };
}
