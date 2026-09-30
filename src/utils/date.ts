import {
  addDays,
  differenceInCalendarDays,
  isBefore,
  format,
  parseISO,
  isValid,
} from 'date-fns';

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(dateISO: string, days: number): string {
  return format(addDays(parseISO(dateISO), days), 'yyyy-MM-dd');
}

export function isOverdue(dueDateISO: string, asOfISO: string = todayISO()): boolean {
  return isBefore(parseISO(dueDateISO), parseISO(asOfISO));
}

export function overdueDays(dueDateISO: string, asOfISO: string = todayISO()): number {
  if (!isOverdue(dueDateISO, asOfISO)) return 0;
  return differenceInCalendarDays(parseISO(asOfISO), parseISO(dueDateISO));
}

export function formatDate(dateISO?: string): string {
  if (!dateISO) return '-';
  const parsed = parseISO(dateISO);
  if (!isValid(parsed)) return '-';
  return format(parsed, 'dd MMM yyyy');
}

export function daysUntil(dateISO: string, asOfISO: string = todayISO()): number {
  return differenceInCalendarDays(parseISO(dateISO), parseISO(asOfISO));
}

/** Local date-time without timezone suffix, e.g. 2026-09-20T14:05:09 (used for audit/submission stamps). */
export function nowISO(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
}

export function formatDateTime(dateTimeISO?: string): string {
  if (!dateTimeISO) return '-';
  const parsed = parseISO(dateTimeISO);
  if (!isValid(parsed)) return '-';
  return format(parsed, 'dd MMM yyyy, hh:mm a');
}
