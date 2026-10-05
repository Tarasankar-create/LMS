import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Download, BookOpen, Search, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { useEBooksStore } from '@/store/ebooksStore';
import { BOOK_CLASSIFICATIONS, type EBook } from '@/types';

export function StudentEBooksPage() {
  const [selectedClassification, setSelectedClassification] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const ebooks = useEBooksStore((s) => s.ebooks);
  const incrementDownload = useEBooksStore((s) => s.incrementDownload);

  // Per FR-ELIB-01 & FR-ELIB-02: Students can ONLY see published e-books
  const publishedEBooks = useMemo(() => {
    return ebooks
      .filter((b) => b.publishStatus === 'Published')
      .filter((b) => selectedClassification === 'All' || b.classification === selectedClassification)
      .filter((b) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.classification.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q))
        );
      });
  }, [ebooks, selectedClassification, searchQuery]);

  function handleReadDownload(ebook: EBook) {
    incrementDownload(ebook.id);
    toast.success(`Opening "${ebook.title}"...`);
    window.open(ebook.fileReference, '_blank');
  }

  return (
    <div>
      <PageHeader
        title="Journals"
        description="Browse, read, and download college journals, research publications, and study resources (FR-ELIB-02)."
      />

      {/* Filter and Search Bar */}
      <div className="mb-6 space-y-4">
        {/* Classification Filters */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-secondary-200 pb-3">
          <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-secondary-500">
            Classification:
          </span>
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

        {/* Search input */}
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder="Search journals by title, author, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-secondary-200 py-2 pl-9 pr-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {/* Grid of e-Books */}
      {publishedEBooks.length === 0 ? (
        <div className="rounded-xl border border-secondary-200 bg-white p-12 text-center shadow-sm">
          <BookOpen className="mx-auto size-12 text-secondary-300 mb-3" />
          <h3 className="text-base font-semibold text-ink">No journals found</h3>
          <p className="mt-1 text-sm text-secondary-500">
            {searchQuery
              ? 'No publications match your search term. Try another keyword.'
              : 'There are currently no published journals in this classification.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publishedEBooks.map((ebook) => (
            <div
              key={ebook.id}
              className="flex flex-col justify-between rounded-xl border border-secondary-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="inline-flex rounded-md bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                    {ebook.classification}
                  </span>
                  <span className="text-[11px] text-secondary-400 font-mono">{ebook.fileSize || 'PDF'}</span>
                </div>

                <h3 className="font-semibold text-ink text-base line-clamp-2">{ebook.title}</h3>
                <p className="mt-1 text-xs text-secondary-600 font-medium">By {ebook.author}</p>

                {ebook.description && (
                  <p className="mt-2.5 text-xs text-secondary-500 line-clamp-3 leading-relaxed">
                    {ebook.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-secondary-100 flex items-center justify-between">
                <span className="text-[11px] text-secondary-400">
                  <Sparkles className="inline size-3 mr-1 text-accent-500" />
                  {ebook.downloadCount} reads
                </span>
                <Button size="sm" onClick={() => handleReadDownload(ebook)}>
                  <Download className="mr-1.5 size-3.5" /> Read / Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
