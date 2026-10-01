export interface LibrarySettings {
  loanPeriodDays: number;
  maxConcurrentLoans: number;
  maxRenewalsPerLoan: number;
  finePerDay: number;
  maxFinePerBook: number;
  blockFineThreshold: number;
  blockOverdueDays: number;
  reservationHoldDays: number;
  dueReminderLeadDays: number;
  workingHours: {
    open: string;
    close: string;
  };
  academicYear: string;
  collegeName: string;
  collegeAddress: string;
}

export const DEFAULT_SETTINGS: LibrarySettings = {
  loanPeriodDays: 14,
  maxConcurrentLoans: 2,
  maxRenewalsPerLoan: 1,
  finePerDay: 2,
  maxFinePerBook: 200,
  blockFineThreshold: 100,
  blockOverdueDays: 7,
  reservationHoldDays: 2,
  dueReminderLeadDays: 2,
  workingHours: { open: '09:30', close: '17:30' },
  academicYear: '2026-27',
  collegeName: 'Pathani Samanta College',
  collegeAddress: 'Khandapara, Nayagarh District, Odisha',
};
