import { useState } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { BOOK_CLASSIFICATIONS, type BookClassification } from '@/types';
import { useJournalsStore } from '@/store/journalsStore';
import { useAuthStore } from '@/store/authStore';

export interface JournalUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type EBookUploadModalProps = JournalUploadModalProps;

export function JournalUploadModal({ isOpen, onClose }: JournalUploadModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [classification, setClassification] = useState<BookClassification>('Course');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const addJournal = useJournalsStore((s) => s.addJournal);
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

    addJournal({
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

    // Reset and close
    setTitle('');
    setAuthor('');
    setClassification('Course');
    setDescription('');
    setIsPublished(false);
    setFileName('');
    setFileSize('');
    setFileUrl('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload New Journal" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Journal Title <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Constitutional Law & Governance in India"
            className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Author / Editor / Publisher <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Prof. S. N. Rath"
              className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Classification <span className="text-danger-500">*</span>
            </label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value as BookClassification)}
              className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {BOOK_CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Upload PDF / Document</label>
          <div className="border-2 border-dashed border-secondary-200 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
            <Upload className="size-8 text-secondary-400 mx-auto mb-2" />
            <input
              type="file"
              id="journal-file-input"
              accept=".pdf,.doc,.docx,.epub"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="journal-file-input"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
            >
              Click to select a file
            </label>
            <p className="text-xs text-secondary-500 mt-1">PDF, EPUB, or Word doc up to 50 MB</p>
            {fileName && (
              <p className="text-xs font-semibold text-success-600 mt-2">
                Selected: {fileName} ({fileSize})
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Description / Syllabus Scope</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of course curriculum topics covered..."
            className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mt-1 size-4 text-primary-600 rounded border-secondary-300 focus:ring-primary-500"
            />
            <div>
              <p className="text-sm font-medium text-ink">Publish immediately for student access</p>
              <p className="text-xs text-secondary-500">
                Leaving this unchecked keeps the journal in Draft status, hidden from students until explicitly published.
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

export const EBookUploadModal = JournalUploadModal;

