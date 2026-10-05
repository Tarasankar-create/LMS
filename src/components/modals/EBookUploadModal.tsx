import { useState } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { BOOK_CLASSIFICATIONS, type BookClassification } from '@/types';
import { useEBooksStore } from '@/store/ebooksStore';
import { useAuthStore } from '@/store/authStore';

interface EBookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EBookUploadModal({ isOpen, onClose }: EBookUploadModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [classification, setClassification] = useState<BookClassification>('Course');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const addEBook = useEBooksStore((s) => s.addEBook);
  const currentUser = useAuthStore((s) => s.currentUser);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      // Create local object URL for preview/download simulation
      const url = URL.createObjectURL(file);
      setFileUrl(url);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      toast.error('Please enter title and author.');
      return;
    }

    addEBook({
      title: title.trim(),
      author: author.trim(),
      classification,
      fileReference: fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: fileSize || '2.5 MB',
      publishStatus: isPublished ? 'Published' : 'Draft',
      description: description.trim() || undefined,
      uploadedBy: `${currentUser?.name ?? 'Admin'} (${currentUser?.role ?? 'Staff'})`,
    });

    toast.success(
      isPublished
        ? 'Journal uploaded and published to students!'
        : 'Journal uploaded as Draft. Publish it when ready for students to view.'
    );
    onClose();
    // Reset form
    setTitle('');
    setAuthor('');
    setClassification('Course');
    setDescription('');
    setIsPublished(false);
    setFileName('');
    setFileSize('');
    setFileUrl('');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Digital Journal / Paper (FR-ELIB-01)" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Journal / Article Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Modern Indian History Lecture Notes"
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary-700">Author / Editor / Publisher *</label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Dept of History, PSC"
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary-700">Classification *</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value as BookClassification)}
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {BOOK_CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* File upload */}
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Journal File (PDF, EPUB) *</label>
          <div className="flex items-center gap-3 rounded-lg border border-secondary-200 p-3">
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-secondary-100 px-3 py-1.5 text-xs font-semibold text-secondary-700 hover:bg-secondary-200">
              <Upload className="size-4" /> Browse PDF File
              <input type="file" accept=".pdf,.epub,.doc,.docx" onChange={handleFileChange} className="sr-only" />
            </label>
            <span className="text-xs text-secondary-500">
              {fileName ? `${fileName} (${fileSize})` : 'Or default standard sample PDF document will be attached.'}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Description / Syllabus Reference</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of contents, targeted semester, or prescribed reading notes..."
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* FR-ELIB-01: Publish toggle */}
        <div className="rounded-lg border border-secondary-200 bg-secondary-50/70 p-3.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="size-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="text-sm font-medium text-ink">Publish immediately for student access</p>
              <p className="text-xs text-secondary-500">
                Per FR-ELIB-01, leaving this unchecked keeps the journal in Draft status, hidden from students until explicitly published.
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-secondary-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Upload Journal</Button>
        </div>
      </form>
    </Modal>
  );
}
