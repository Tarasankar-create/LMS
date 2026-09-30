import { PageHeader } from '@/components/common/PageHeader';
import { IssueBookForm } from '@/components/forms/IssueBookForm';
import { useSettingsStore } from '@/store/settingsStore';

export function IssueBookPage() {
  const settings = useSettingsStore((s) => s.settings);

  return (
    <div>
      <PageHeader title="Issue a Book" description="Search for a member and a book to record a new loan." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm lg:col-span-2">
          <IssueBookForm />
        </div>
        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-ink">Circulation Rules</h3>
          <ul className="space-y-2 text-sm text-secondary-600">
            <li>Loan period: <span className="font-medium text-ink">{settings.loanPeriodDays} days</span></li>
            <li>Max concurrent loans per member: <span className="font-medium text-ink">{settings.maxConcurrentLoans}</span></li>
            <li>Fine: <span className="font-medium text-ink">₹{settings.finePerDay}/day</span> (capped at ₹{settings.maxFinePerBook})</li>
          </ul>
          <p className="mt-4 text-xs text-secondary-500">
            These values are configurable from Settings and subject to college approval.
          </p>
        </div>
      </div>
    </div>
  );
}
