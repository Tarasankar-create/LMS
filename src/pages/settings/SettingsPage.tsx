import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { SettingsForm } from '@/components/forms/SettingsForm';
import { useConfirm } from '@/components/common/ConfirmDialogProvider';
import { useSettingsStore } from '@/store/settingsStore';
import { resetDemoData } from '@/store/seedManager';
import type { SettingsFormValues } from '@/utils/validators/settingsSchema';

export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);
  const confirm = useConfirm();

  function handleSave(values: SettingsFormValues) {
    updateSettings(values);
    toast.success('Settings saved. New rules apply immediately to future transactions.');
  }

  async function handleResetDemoData() {
    const ok = await confirm({
      title: 'Reset all demo data?',
      description:
        'This clears every book, member, loan, fine, reservation, and notice you have added or modified, and reseeds the original demo dataset. This cannot be undone.',
      confirmLabel: 'Reset Everything',
      tone: 'danger',
    });
    if (ok) resetDemoData();
  }

  return (
    <div>
      <PageHeader title="Settings" description="Configure library business rules and college information." />

      <div className="max-w-3xl space-y-6">
        <div className="rounded-xl border border-secondary-100 bg-white p-6 shadow-sm">
          <SettingsForm settings={settings} onSave={handleSave} onReset={resetToDefaults} />
        </div>

        <div className="rounded-xl border border-danger-200 bg-danger-50/40 p-6">
          <h3 className="mb-1 text-sm font-semibold text-danger-700">Danger Zone</h3>
          <p className="mb-3 text-sm text-secondary-600">
            Permanently clear all demo data (books, members, loans, fines, reservations, notices) and reseed a fresh
            demo dataset.
          </p>
          <Button variant="danger" onClick={handleResetDemoData}>
            Reset Demo Data
          </Button>
        </div>
      </div>
    </div>
  );
}
