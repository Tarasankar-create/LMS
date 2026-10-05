import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Download, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EBookUploadModal } from '@/components/modals/EBookUploadModal';
import { useEBooksStore } from '@/store/ebooksStore';
import { useConfirm } from '@/components/common/ConfirmDialogProvider';
import { BOOK_CLASSIFICATIONS, type EBook } from '@/types';

export function EBooksManagementPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedClassification, setSelectedClassification] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const ebooks = useEBooksStore((s) => s.ebooks);
  const togglePublishStatus = useEBooksStore((s) => s.togglePublishStatus);
  const deleteEBook = useEBooksStore((s) => s.deleteEBook);
  const confirm = useConfirm();

  const filteredEBooks = useMemo(() => {
    return ebooks
      .filter((b) => selectedClassification === 'All' || b.classification === selectedClassification)
      .filter((b) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.classification.toLowerCase().includes(q)
        );
      });
  }, [ebooks, selectedClassification, searchQuery]);

  async function handleDelete(ebook: EBook) {
    const ok = await confirm({
      title: 'Delete Journal?',
      description: `Are you sure you want to permanently delete "${ebook.title}"?`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (ok) {
      deleteEBook(ebook.id);
      toast.success('Journal deleted.');
    }
  }

  function handleTogglePublish(ebook: EBook) {
    togglePublishStatus(ebook.id);
    const willBePublished = ebook.publishStatus !== 'Published';
    toast.success(
      willBePublished
        ? `"${ebook.title}" published! Now accessible to all students.`
        : `"${ebook.title}" unpublished and moved back to Draft.`
    );
  }

  function handleViewDownload(ebook: EBook) {
    window.open(ebook.fileReference, '_blank');
  }

  return (
    <div>
      <PageHeader
        title="Journals"
        description="Upload and publish electronic syllabus materials, lecture notes, and e-books for student access (FR-ELIB-01)."
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Upload Journal
          </Button>
        }
      />

      {/* Classification Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-secondary-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-secondary-500">Classification:</span>
          {['All', ...BOOK_CLASSIFICATIONS].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClassification(cls)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedClassification === cls
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter journals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg border border-secondary-200 px-3 py-1.5 text-xs focus:border-primary-400 focus:outline-none"
        />
      </div>

      {/* Documents Table */}
      <div className="rounded-xl border border-secondary-100 bg-white shadow-sm overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-secondary-100 bg-secondary-50/60 text-xs font-semibold uppercase tracking-wide text-secondary-500">
              <tr>
                <th className="px-4 py-3">Journal Title & Details</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Size / Uploaded By</th>
                <th className="px-4 py-3">Publish Status (FR-ELIB-01)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filteredEBooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-secondary-500">
                    No journals found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredEBooks.map((ebook) => (
                  <tr key={ebook.id} className="hover:bg-secondary-50/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <BookOpen className="size-5 text-primary-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-ink">{ebook.title}</p>
                          <p className="text-xs text-secondary-500">{ebook.author}</p>
                          {ebook.description && (
                            <p className="mt-1 text-xs text-secondary-600 line-clamp-1">{ebook.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-800">
                        {ebook.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-medium text-ink">{ebook.fileSize || '2.0 MB'}</p>
                      <p className="text-xs text-secondary-500">{ebook.uploadedBy}</p>
                      <p className="text-[11px] text-secondary-400">Added {ebook.uploadedAt}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge tone={ebook.publishStatus === 'Published' ? 'success' : 'warning'}>
                          {ebook.publishStatus}
                        </Badge>
                        <button
                          onClick={() => handleTogglePublish(ebook)}
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 underline font-medium"
                          title={ebook.publishStatus === 'Published' ? 'Unpublish to Draft' : 'Publish to Students'}
                        >
                          {ebook.publishStatus === 'Published' ? (
                            <>
                              <EyeOff className="size-3" /> Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="size-3" /> Publish
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => handleViewDownload(ebook)}>
                          <Download className="mr-1 size-3.5" /> View / Download
                        </Button>
                        <button
                          onClick={() => handleDelete(ebook)}
                          className="rounded-lg p-1.5 text-secondary-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EBookUploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
