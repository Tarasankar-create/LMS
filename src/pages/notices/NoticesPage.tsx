import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useConfirm } from '@/components/common/ConfirmDialogProvider';
import { DataTable } from '@/components/tables/DataTable';
import { SelectField, TextAreaField, TextField } from '@/components/forms/FormControls';
import { useCan } from '@/access/useCan';
import { useAuthStore } from '@/store/authStore';
import { isNoticeExpired, isNoticeLive, useNoticesStore } from '@/store/noticesStore';
import { NOTICE_CATEGORIES, type Notice } from '@/types';
import { formatDate, todayISO } from '@/utils/date';
import { generateId } from '@/utils/id';

type NoticeDraft = Omit<Notice, 'id'>;

function blankNotice(createdBy: string): NoticeDraft {
  return { title: '', content: '', category: 'Library Notices', publishDate: todayISO(), createdBy };
}

function validateNotice(n: NoticeDraft): string | null {
  if (!n.title.trim()) return 'Give the notice a title.';
  if (!n.content.trim()) return 'Write the notice text.';
  if (!n.publishDate) return 'Choose a publish date.';
  if (n.expiryDate && n.expiryDate < n.publishDate) return 'The expiry date cannot be before the publish date.';
  return null;
}

function statusOf(n: Notice): { label: string; tone: 'success' | 'warning' | 'neutral' } {
  if (isNoticeExpired(n)) return { label: 'Expired', tone: 'neutral' };
  if (isNoticeLive(n)) return { label: 'Live', tone: 'success' };
  return { label: 'Scheduled', tone: 'warning' };
}

/** The library notice board: staff write notices here and students read them in the portal. */
export function NoticesPage() {
  const notices = useNoticesStore((s) => s.notices);
  const addNotice = useNoticesStore((s) => s.addNotice);
  const updateNotice = useNoticesStore((s) => s.updateNotice);
  const deleteNotice = useNoticesStore((s) => s.deleteNotice);
  const currentUser = useAuthStore((s) => s.currentUser);
  const can = useCan();
  const confirm = useConfirm();

  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<NoticeDraft>(() => blankNotice(''));

  const canCreate = can('notices', 'create');
  const canEdit = can('notices', 'edit');
  const canDelete = can('notices', 'delete');

  function openNew() {
    setDraft(blankNotice(currentUser?.name ?? 'Staff'));
    setEditingId('new');
  }

  function openEdit(notice: Notice) {
    const { id, ...rest } = notice;
    void id;
    setDraft(rest);
    setEditingId(notice.id);
  }

  function handleSave() {
    const error = validateNotice(draft);
    if (error) {
      toast.error(error);
      return;
    }
    const clean = { ...draft, title: draft.title.trim(), content: draft.content.trim() };
    if (editingId === 'new') {
      addNotice({ ...clean, id: generateId('notice') });
      toast.success('Notice published.');
    } else if (editingId) {
      updateNotice(editingId, clean);
      toast.success('Notice updated.');
    }
    setEditingId(null);
  }

  async function handleDelete(notice: Notice) {
    const ok = await confirm({
      title: 'Delete this notice?',
      description: `"${notice.title}" will be removed from the notice board and the student portal.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (ok) {
      deleteNotice(notice.id);
      toast.success('Notice deleted.');
    }
  }

  const rows = useMemo(() => [...notices].sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1)), [notices]);

  const columns = useMemo<ColumnDef<Notice, unknown>[]>(
    () => [
      { accessorKey: 'title', header: 'Notice', cell: ({ row }) => <span className="font-medium text-ink">{row.original.title}</span> },
      { accessorKey: 'category', header: 'Category' },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => {
          const s = statusOf(row.original);
          return <Badge tone={s.tone}>{s.label}</Badge>;
        },
      },
      {
        accessorKey: 'publishDate',
        header: 'Dates',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-secondary-600">
            {formatDate(row.original.publishDate)}
            {row.original.expiryDate && (
              <span className="block text-xs text-secondary-500">
                {isNoticeExpired(row.original) ? 'Expired' : 'Expires'} {formatDate(row.original.expiryDate)}
              </span>
            )}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {canEdit && (
              <Button size="sm" variant="ghost" aria-label={`Edit ${row.original.title}`} onClick={() => openEdit(row.original)}>
                <Pencil className="size-4" />
              </Button>
            )}
            {canDelete && (
              <Button size="sm" variant="ghost" aria-label={`Delete ${row.original.title}`} onClick={() => handleDelete(row.original)}>
                <Trash2 className="size-4 text-danger-500" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, canDelete],
  );

  return (
    <div>
      <PageHeader
        title="Notices"
        description="The library notice board. Notices appear in the student portal from their publish date until they expire."
        actions={
          canCreate && (
            <Button onClick={openNew}>
              <Plus className="size-4" /> New Notice
            </Button>
          )
        }
      />

      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search notices..."
        emptyState={{ title: 'No notices yet', description: 'Create the first notice to show it in the student portal.' }}
      />

      <Modal
        isOpen={editingId !== null}
        onClose={() => setEditingId(null)}
        title={editingId === 'new' ? 'New Notice' : 'Edit Notice'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId === 'new' ? 'Publish' : 'Save Changes'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
          <TextAreaField label="Notice text" rows={6} value={draft.content} onChange={(content) => setDraft({ ...draft, content })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Category"
              value={draft.category}
              options={NOTICE_CATEGORIES}
              onChange={(category) => setDraft({ ...draft, category: category as Notice['category'] })}
            />
            <TextField type="date" label="Publish date" value={draft.publishDate} onChange={(publishDate) => setDraft({ ...draft, publishDate })} />
            <TextField
              type="date"
              label="Expiry date (optional)"
              value={draft.expiryDate ?? ''}
              onChange={(expiryDate) => setDraft({ ...draft, expiryDate: expiryDate || undefined })}
              hint="After this date the notice is hidden from students."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
