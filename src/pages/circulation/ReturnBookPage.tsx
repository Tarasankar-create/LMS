import { PageHeader } from '@/components/common/PageHeader';
import { ReturnBookForm } from '@/components/forms/ReturnBookForm';
import { useSettingsStore } from '@/store/settingsStore';

export function ReturnBookPage() {
  const settings = useSettingsStore((s) => s.settings);

  return (
    <div>
      <PageHeader title="Return a Book" description="Search for an active loan by membership ID or accession number." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm lg:col-span-2">
          <ReturnBookForm />
        </div>
        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-ink">Fine Policy</h3>
          <p className="text-sm text-secondary-600">
            Overdue returns are fined at <span className="font-medium text-ink">₹{settings.finePerDay} per book per day</span>,
            capped at <span className="font-medium text-ink">₹{settings.maxFinePerBook} per book</span>. Returning the book
            also promotes the next pending reservation on that title, if any.
          </p>
        </div>
      </div>
    </div>
  );
}
