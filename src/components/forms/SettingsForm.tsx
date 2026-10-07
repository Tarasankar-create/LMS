import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema, type SettingsFormValues } from '@/utils/validators/settingsSchema';
import { Button } from '@/components/common/Button';
import type { LibrarySettings } from '@/types';

interface SettingsFormProps {
  settings: LibrarySettings;
  onSave: (values: SettingsFormValues) => void;
  onReset: () => void;
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-secondary-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-secondary-500">{hint}</p>}
    </div>
  );
}

export function SettingsForm({ settings, onSave, onReset }: SettingsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  function handleResetClick() {
    reset(settings);
    onReset();
  }

  const inputClass =
    'w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100';

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6" noValidate>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink">Circulation Rules</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="loanPeriodDays" label="Loan Period (days)" hint="Number of days a book can be borrowed for (1–90).">
            <input id="loanPeriodDays" type="number" min="1" max="90" step="1" {...register('loanPeriodDays', { valueAsNumber: true })} className={inputClass} />
            {errors.loanPeriodDays && <p className="mt-1 text-xs text-danger-600">{errors.loanPeriodDays.message}</p>}
          </Field>
          <Field id="maxConcurrentLoans" label="Max Concurrent Loans" hint="Maximum books a member may hold at once (1–10).">
            <input id="maxConcurrentLoans" type="number" min="1" max="10" step="1" {...register('maxConcurrentLoans', { valueAsNumber: true })} className={inputClass} />
            {errors.maxConcurrentLoans && <p className="mt-1 text-xs text-danger-600">{errors.maxConcurrentLoans.message}</p>}
          </Field>
          <Field id="maxRenewalsPerLoan" label="Max Renewals per Loan" hint="Maximum renewals permitted per borrowed book (0–5).">
            <input id="maxRenewalsPerLoan" type="number" min="0" max="5" step="1" {...register('maxRenewalsPerLoan', { valueAsNumber: true })} className={inputClass} />
            {errors.maxRenewalsPerLoan && <p className="mt-1 text-xs text-danger-600">{errors.maxRenewalsPerLoan.message}</p>}
          </Field>
          <Field id="dueReminderLeadDays" label="Due Reminder Lead (days)" hint="Days before due date to alert borrowers that a book is due soon (1–14).">
            <input id="dueReminderLeadDays" type="number" min="1" max="14" step="1" {...register('dueReminderLeadDays', { valueAsNumber: true })} className={inputClass} />
            {errors.dueReminderLeadDays && <p className="mt-1 text-xs text-danger-600">{errors.dueReminderLeadDays.message}</p>}
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink">Fine & Member Blocking Policy</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="finePerDay" label="Fine per Day (₹)" hint="Daily penalty rate for overdue books.">
            <input id="finePerDay" type="number" step="0.5" min="0" max="100" {...register('finePerDay', { valueAsNumber: true })} className={inputClass} />
            {errors.finePerDay && <p className="mt-1 text-xs text-danger-600">{errors.finePerDay.message}</p>}
          </Field>
          <Field id="maxFinePerBook" label="Max Fine per Book (₹)" hint="Maximum fine ceiling per book borrowed.">
            <input id="maxFinePerBook" type="number" min="0" max="5000" step="1" {...register('maxFinePerBook', { valueAsNumber: true })} className={inputClass} />
            {errors.maxFinePerBook && <p className="mt-1 text-xs text-danger-600">{errors.maxFinePerBook.message}</p>}
          </Field>
          <Field id="blockFineThreshold" label="Block Fine Threshold (₹)" hint="Unpaid fine amount at which borrowing is automatically blocked.">
            <input id="blockFineThreshold" type="number" min="0" max="10000" step="1" {...register('blockFineThreshold', { valueAsNumber: true })} className={inputClass} />
            {errors.blockFineThreshold && <p className="mt-1 text-xs text-danger-600">{errors.blockFineThreshold.message}</p>}
          </Field>
          <Field id="blockOverdueDays" label="Block Overdue Threshold (days)" hint="Days overdue after which borrowing is automatically blocked.">
            <input id="blockOverdueDays" type="number" min="1" max="90" step="1" {...register('blockOverdueDays', { valueAsNumber: true })} className={inputClass} />
            {errors.blockOverdueDays && <p className="mt-1 text-xs text-danger-600">{errors.blockOverdueDays.message}</p>}
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink">Reservations & Hours</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="reservationHoldDays" label="Reservation Hold (days)">
            <input id="reservationHoldDays" type="number" {...register('reservationHoldDays', { valueAsNumber: true })} className={inputClass} />
            {errors.reservationHoldDays && <p className="mt-1 text-xs text-danger-600">{errors.reservationHoldDays.message}</p>}
          </Field>
          <Field id="workingHoursOpen" label="Opening Time">
            <input id="workingHoursOpen" type="time" {...register('workingHours.open')} className={inputClass} />
          </Field>
          <Field id="workingHoursClose" label="Closing Time">
            <input id="workingHoursClose" type="time" {...register('workingHours.close')} className={inputClass} />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink">College Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="collegeName" label="College Name">
            <input id="collegeName" {...register('collegeName')} className={inputClass} />
          </Field>
          <Field id="academicYear" label="Academic Year">
            <input id="academicYear" {...register('academicYear')} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="collegeAddress" label="College Address">
              <input id="collegeAddress" {...register('collegeAddress')} className={inputClass} />
            </Field>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-dashed border-warning-500/40 bg-warning-50 p-3 text-xs text-warning-700">
        These business rules are configurable defaults and are subject to confirmation by the Librarian and Principal
        before go-live, per the college's BRD.
      </div>

      <div className="flex justify-end gap-2 border-t border-secondary-100 pt-4">
        <Button type="button" variant="outline" onClick={handleResetClick}>
          Reset to Defaults
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
